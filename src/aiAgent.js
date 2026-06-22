class WhiteboardAgent {
  analyze(rawIdeas) {
    const ideas = rawIdeas
      .map((idea) => String(idea || '').trim())
      .filter(Boolean);

    const normalizedWords = ideas.map((idea) => {
      return new Set(
        idea
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter((token) => token.length > 2)
      );
    });

    const intersections = [];

    for (let i = 0; i < ideas.length; i += 1) {
      for (let j = i + 1; j < ideas.length; j += 1) {
        const overlap = [...normalizedWords[i]].filter((word) => normalizedWords[j].has(word));
        intersections.push({
          pair: [ideas[i], ideas[j]],
          overlap,
        });
      }
    }

    const strongest = intersections
      .slice()
      .sort((a, b) => b.overlap.length - a.overlap.length)
      .slice(0, 3);

    const prompts = strongest.map(({ pair, overlap }) => {
      if (!overlap.length) {
        return `Explore how "${pair[0]}" could unexpectedly support "${pair[1]}".`;
      }
      return `Build around ${overlap.join(', ')} to connect "${pair[0]}" with "${pair[1]}".`;
    });

    return {
      ideas,
      intersections,
      prompts,
      summary: `Analyzed ${ideas.length} ideas and generated ${prompts.length} bridge prompt(s).`,
    };
  }
}

module.exports = { WhiteboardAgent };
