import CoroutineContext from "./CoroutineContext";
import ExoticCoroutineAwait from "./ExoticCoroutineAwait";
import AwaiterCastable from "./awaiting/AwaiterCastable";

export type CoroutineGeneratorYieldable<Context> =
    | AwaiterCastable<Context>
    | ExoticCoroutineAwait<symbol>;

type CoroutineGenerator<Context> = Generator<
    CoroutineGeneratorYieldable<Context>,
    void,
    CoroutineContext<Context>
>;
export default CoroutineGenerator;
