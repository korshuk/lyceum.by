var assert = require('assert');
var expect = require('chai').expect;

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
        var foo = [1, 2, 3].indexOf(4);
        expect(foo).to.equal(-1);
    });
    it('should return index when the value is present', function() {
        var foo = [1, 2, 3].indexOf(2);
        expect(foo).to.equal(1);
    });
  });
  describe('#array length', function() {
    it('should return array length when array is not empty', function() {
        var foo = [1, 2, 3];
        expect(foo).to.have.length(3);
    });
  });
});
