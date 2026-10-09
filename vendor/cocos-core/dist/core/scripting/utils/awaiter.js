"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Awaiter = void 0;
const asserts_1 = require("./asserts");
class Awaiter {
    resolve(value) {
        (0, asserts_1.asserts)(this._state === State.PENDING);
        this._result = value;
        this._state = State.RESOLVED;
        for (const { resolve } of this._queue) {
            resolve(value);
        }
        this._queue.length = 0;
    }
    reject(err) {
        (0, asserts_1.asserts)(this._state === State.PENDING);
        this._result = err;
        this._state = State.RESOLVED;
        for (const { reject } of this._queue) {
            reject(err);
        }
        this._queue.length = 0;
    }
    async wait() {
        switch (this._state) {
            case State.RESOLVED:
                return this._result;
            case State.REJECTED:
                throw this._result;
        }
        return await new Promise((resolve, reject) => {
            this._queue.push({
                resolve,
                reject,
            });
        });
    }
    _state = State.PENDING;
    _result = null;
    _queue = [];
}
exports.Awaiter = Awaiter;
var State;
(function (State) {
    State[State["PENDING"] = 0] = "PENDING";
    State[State["RESOLVED"] = 1] = "RESOLVED";
    State[State["REJECTED"] = 2] = "REJECTED";
})(State || (State = {}));
