import Coroutine from "~/manager/Coroutine";
import CoroutineGeneratorFunction from "../CoroutineGeneratorFunction";
import CoroutineAwait from "./CoroutineAwait";

/**
 * Each type that can be automatically casted to an awaiter.
 */
type AwaiterCastable<Context> =
    | CoroutineAwait<Context, unknown>
    | Coroutine<Context>
    | CoroutineGeneratorFunction<Context>
    | undefined;

export default AwaiterCastable;
