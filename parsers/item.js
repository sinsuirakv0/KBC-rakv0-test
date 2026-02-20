function decodeWeekdays(bitmask) {
  if (bitmask === 0) return [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days.filter((_, i) => (bitmask >> i) & 1);
}

export function parseItem(tsv) {
  const lines = tsv
    .trim()
    .split("\n")
    .filter(line => line.trim() && line !== "[start]" && line !== "[end]");

  return lines.map(line => {
    const parts = line.trim().split("\t");
    const header = {
      startDate: parts[0],
      startTime: parts[1],
      endDate: parts[2],
      endTime: parts[3],
      minVersion: parts[4],
      maxVersion: parts[5]
    };

    let index = 6;
    index++; // skip unused field

    const timeBlocks = [];
    const timeBlockCount = parseInt(parts[index++], 10);

    for (let i = 0; i < timeBlockCount; i++) {
      const block = {
        dateRanges: [],
        monthDays: [],
        weekdays: [],
        timeRanges: []
      };

      const yearCount = parseInt(parts[index++], 10);
      for (let j = 0; j < yearCount; j++) {
        const startDay = parts[index++];
        const startTime = parts[index++];
        const endDay = parts[index++];
        const endTime = parts[index++];
        block.dateRanges.push({ start: `${startDay} ${startTime}`, end: `${endDay} ${endTime}` });
      }

      const monthCount = parseInt(parts[index++], 10);
      for (let j = 0; j < monthCount; j++) {
        block.monthDays.push(parseInt(parts[index++], 10));
      }

      const weekdayBits = parseInt(parts[index++], 10);
      block.weekdays = decodeWeekdays(weekdayBits);

      const timeRangeCount = parseInt(parts[index++], 10);
      for (let j = 0; j < timeRangeCount; j++) {
        const start = parts[index++];
        const end = parts[index++];
        block.timeRanges.push([start, end]);
      }

      timeBlocks.push(block);
    }

    const remaining = parts.slice(index);
    let eventId = 0, giftType = 0, giftAmount = 0, title = "", message = "", url = "", repeatFlag = 0;

    if (remaining.length >= 8) {
      eventId = parseInt(remaining[0], 10) || 0;
      giftType = parseInt(remaining[1], 10) || 0;
      giftAmount = parseInt(remaining[2], 10) || 0;

      const rawTitle = remaining[3] || "";
      const rawMessageOrUrl = remaining[4] || "";

      if (rawMessageOrUrl.startsWith("http")) {
        title = rawTitle;
        url = rawMessageOrUrl;
      } else if (rawTitle.startsWith("http")) {
        url = rawTitle;
      } else {
        title = rawTitle;
        message = rawMessageOrUrl;
      }

      repeatFlag = parseInt(remaining[7], 10) || 0;
    }

    return {
      header,
      timeBlocks,
      gift: {
        eventId,
        giftType,
        giftAmount,
        title,
        message,
        url,
        repeatFlag
      }
    };
  });
}
