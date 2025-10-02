/* Master agent bundle (compiled by frida-compile in real builds)
 * Placeholder implementation; expose a ping and a version to verify loading.
 */

rpc.exports = {
  ping() { return 'ok'; },
  version() { return 'master-agent@dev'; },
  // Minimal stubs so RPCs always resolve; real implementation lives in feature agents
  mem_scan() { return []; },
  mem_refine(addrs, _opts) { return Array.isArray(addrs) ? addrs : []; }
};
