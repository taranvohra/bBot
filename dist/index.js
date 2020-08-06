"use strict";
var X = /** @class */ (function () {
    function X() {
        this.f = 1;
        this.y = 2;
    }
    X.prototype.foo = function () {
        throw new Error('wuuuut');
    };
    return X;
}());
var j = new X();
j.foo();
//# sourceMappingURL=index.js.map