import Coroutine from "./Coroutine";

export default interface ControllerManagerInterface<Context> {
    /**
     * Registers a coroutine to run each tick.
     */
    registerCoroutine(coroutine: Coroutine<Context>): void;

    /**
     * Stops a coroutine from running each tick.
     *
     * Throws an error if the component isn't registered.
     */
    deregisterCoroutine(coroutine: Coroutine<Context>): void;

    /**
     * Called when the active focus target changes, to store the identifier for debugging.
     */
    handleActiveFocusTargetChanged(identifier: string | null | undefined): void;
}
