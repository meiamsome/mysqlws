"use strict";

describe('load tests', function() {
  it('loads onto window', function() {
    expect(window.mysqlws).toBeDefined();
    expect(mysqlws).toBeDefined();
  });

  it('has no server implementation', function() {
    expect(mysqlws.Server).not.toBeDefined();
  })
})
