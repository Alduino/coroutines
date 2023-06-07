import CoroutineAwait from "~/types/awaiting/CoroutineAwait";
import CoroutineAwaitResult from "~/types/awaiting/CoroutineAwaitResult";
import Coroutine, {CoroutineHandlerStartInterface} from "./Coroutine";
import {NestOptions} from "./awaiters/exotic/nest";
import nextTick from "./awaiters/nextTick";

export interface NestedCoroutineHandlerOptions<Context, Result>
    extends NestOptions<Context, Result> {
    isFocused: CoroutineHandlerStartInterface["isFocused"];
    parentStackTrace: readonly string[];
}

export default class NestedCoroutineHandler<Context, Result> {
    readonly #options: NestedCoroutineHandlerOptions<Context, Result>;

    readonly #castedAwaiters: (
        | CoroutineAwait<Context, unknown>
        | Coroutine<Context>
        | null
    )[];

    #checkCount = 0;

    constructor(options: NestedCoroutineHandlerOptions<Context, Result>) {
        this.#options = options;

        this.#castedAwaiters = options.awaiters.map(awaiter => {
            if (typeof awaiter === "function") {
                return new Coroutine({
                    identifier: awaiter.name,
                    coroutine: awaiter,
                });
            } else if (!awaiter) {
                return nextTick();
            } else {
                return awaiter;
            }
        });

        const stackTrace = [...this.#options.parentStackTrace];
        if (this.#options.identifier) stackTrace.push(this.#options.identifier);

        for (const handler of this.#castedAwaiters) {
            if (!(handler instanceof Coroutine)) continue;

            handler.start({
                delete: () => this.#deleteHandler(handler),
                isFocused: options.isFocused,
                parentStackTrace: stackTrace,
            });
        }
    }

    dispose() {
        for (const handler of this.#castedAwaiters) {
            if (!(handler instanceof Coroutine)) continue;

            handler.dispose();
        }
    }

    handle(ctx: Context) {
        const results: (CoroutineAwaitResult<unknown> | null)[] = [];

        for (const handler of this.#castedAwaiters) {
            if (handler instanceof Coroutine) {
                handler.handle(ctx);
                results.push(null);

                this.#checkCount += handler.getLastCheckCount();
            } else {
                const res = handler.shouldContinue(ctx);
                results.push(res);

                this.#checkCount++;
            }
        }

        const fullResults: CoroutineAwaitResult<unknown>[] = results.map(
            (result, index) => {
                if (result === null) {
                    return {
                        done: this.#castedAwaiters[index] === null,
                    } as CoroutineAwaitResult<unknown>;
                } else return result;
            },
        );

        return this.#options.handler(ctx, fullResults);
    }

    /**
     * Returns the number of `shouldContinue` calls that ran on the last `handle` call.
     *
     * Useful for displaying debugging information.
     */
    getLastCheckCount() {
        return 0;
    }

    #deleteHandler(handler: Coroutine<Context>) {
        const index = this.#castedAwaiters.indexOf(handler);

        if (index === -1) {
            throw new Error(
                "Handler does not exist, it may have been deleted already",
            );
        }

        this.#castedAwaiters[index] = null;
    }
}
