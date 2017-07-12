"use strict";

var mysqlws = require('..');

describe('mysqlws', function() {
  it('exports mysqlws', function() {
    expect(mysqlws).toBeDefined();
    expect(mysqlws).not.toBe(null);
  });

  it('has a Server implementation', function() {
    expect(mysqlws.Server).toBeDefined();
  });
});
