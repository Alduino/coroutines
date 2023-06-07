import CommonAwaiterOptions from "~/types/awaiting/CommonAwaiterOptions";
import CoroutineAwait from "~/types/awaiting/CoroutineAwait";

export default function delay<Context>(
    ms: number,
    options: CommonAwaiterOptions = {},
): CoroutineAwait<Context, void> {
    let done = false;

    const delay = new Promise<void>(yay => {
        setTimeout(() => {
            done = true;
            yay();
        }, ms);
    });

    return {
        ...options,
        identifier: "waitUntil.delay",
        delay,
        shouldContinue() {
            return {done};
        },
    };
}
