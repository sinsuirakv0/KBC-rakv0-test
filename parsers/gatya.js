export function parseGatya(tsv) {
  const lines = tsv.trim().split("\n");
  const results = [];

  for (const line of lines) {
    const cells = line.trim().split("\t");
    if (cells.length < 10) continue;

    const header = {
      startDate: cells[0],
      startTime: cells[1],
      endDate: cells[2],
      endTime: cells[3],
      minVersion: cells[4],
      maxVersion: cells[5],
      gachaType: Number(cells[8]),
      gachaCount: Number(cells[9])
    };

    const gachas = [];
    let offset = 10;
    for (let i = 0; i < header.gachaCount; i++) {
      const gachaSlice = cells.slice(offset, offset + 15);
      const gachaId = Number(gachaSlice[0]);
      if (gachaId !== -1) {
        gachas.push({
          id: gachaId,
          price: Number(gachaSlice[1]),
          flags: Number(gachaSlice[3]),
          rates: {
            normal: Number(gachaSlice[4]),
            rare: Number(gachaSlice[6]),
            superRare: Number(gachaSlice[8]),
            uberRare: Number(gachaSlice[10]),
            legendRare: Number(gachaSlice[12])
          },
          guaranteed: Number(gachaSlice[11]) === 1,
          message: gachaSlice[14]
        });
      }
      offset += 15;
    }

    results.push({ header, gachas });
  }

  return results;
}
