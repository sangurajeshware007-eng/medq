/**
 * @format
 */

describe('MedReachPlus app', () => {
  it('has a valid package name', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require('../package.json') as { name: string };
    expect(pkg.name).toBe('MedReachPlus');
  });
});
