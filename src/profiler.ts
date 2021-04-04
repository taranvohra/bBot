import heapdump from 'heapdump';

const takeSnapshot = (): Promise<string | undefined> =>
  new Promise((rs, rj) => {
    heapdump.writeSnapshot(
      `/tmp/bbot_snapshots/${Date.now()}.heapsnapshot`,
      (error, filename) => {
        if (error) rj(error);
        rs(filename);
      }
    );
  });

export { takeSnapshot };
