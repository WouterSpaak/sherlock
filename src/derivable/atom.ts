import { Logger } from '@politie/informant';
import { recordObservation } from '../tracking';
import { processChangedAtom } from '../transaction';
import { equals } from '../utils';
import { Derivable } from './derivable';

const logger = Logger.get('@politie/sherlock.atom');

/**
 * Atom is the basic state holder in a Derivable world. It contains the actual mutable state. In contrast
 * with other kinds of derivables that only store immutable (constant) or derived state. Should be constructed
 * with the initial state.
 */
export class Atom<V> extends Derivable<V> {
    /**
     * Construct a new atom with the provided initial value.
     *
     * @param value the initial value
     */
    constructor(
        /**
         * @internal
         * Contains the current value of this atom. Note that this field is public for transaction support, should
         * not be used in application code. Use {@link Derivable#get} and {@link Atom#set} instead.
         */
        public value: V,
    ) {
        super();
        logger.trace({ id: this.id, value }, 'created');
    }

    /**
     * @internal
     * The current version of the state. This number gets incremented every time the state changes. Setting the state to
     * an immutable object that is structurally equal to the previous immutable object is not considered a state change.
     */
    version = 0;

    /**
     * Returns the current value of this derivable. Automatically records the use of this derivable when inside a derivation.
     */
    get() {
        recordObservation(this);
        return this.value;
    }

    /**
     * Sets the value of this atom, fires reactors when expected.
     *
     * @param newValue the new state
     */
    set(newValue: V) {
        const oldValue = this.value;
        if (!equals(newValue, oldValue)) {
            this.value = newValue;
            logger.trace({ id: this.id, newValue, oldValue }, 'changed');
            processChangedAtom(this, oldValue, this.version++);
        }
    }

    /**
     * Swaps the current value of this atom using the provided swap function. Any additional arguments to this function are
     * fed to the swap function.
     *
     * @param f the swap function
     */
    swap(f: (v: V) => V): void;
    swap<P1>(f: (v: V, p1: P1) => V, p1: P1 | Derivable<P1>): void;
    swap<P1, P2>(f: (v: V, p1: P1, p2: P2) => V, p1: P1 | Derivable<P1>, p2: P2 | Derivable<P2>): void;
    swap<P>(f: (v: V, ...ps: P[]) => V, ...ps: Array<P | Derivable<P>>): void;
    swap(f: (oldValue: V, ...args: any[]) => V, ...args: any[]) {
        this.set(f(this.value, ...args));
    }
}

/**
 * Construct a new atom with the provided initial value.
 *
 * @param value the initial value
 */
export function atom<V>(value: V): Atom<V> {
    return new Atom(value);
}
