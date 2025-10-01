/* Master agent bundle (compiled by frida-compile in real builds)
 * Placeholder implementation; expose a ping and a version to verify loading.
 */

rpc.exports = {
  ping() { return 'ok'; },
  version() { return 'master-agent@dev'; }
};

