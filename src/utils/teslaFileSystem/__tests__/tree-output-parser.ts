/**
 *
 *  └── SentryClips
 *      ├── 2025-05-01_16-51-37
 *      │   ├── 2025-05-01_16-41-06-back.mp4
 *      │   ├── 2025-05-01_16-41-06-front.mp4
 *      │   ├── 2025-05-01_16-41-06-left_repeater.mp4
 *
 * >>>
 *
 * [
 *   { name: 'SentryClips/2025-05-01_16-51-37/2025-05-01_16-41-06-back.mp4', webkitRelativePath: SentryClips },
 *   { name: 'SentryClips/2025-05-01_16-51-37/2025-05-01_16-41-06-front.mp4', webkitRelativePath: SentryClips },
 *   { name: 'SentryClips/2025-05-01_16-51-37/2025-05-01_16-41-06-left_repeater.mp4', webkitRelativePath: SentryClips },
 * ]
 */

export const treeOutputParser = (output: string): FileListLike => {
  const lines = output.split("\n");

  const [, files, folders] = lines.reduce(
    (reduced, line) => {
      const i = (line.indexOf("└── ") + 1 || line.indexOf("├── ") + 1) - 1;
      if (i === -1) return reduced;

      const indentation = i / "├── ".length;

      const [context, files, folders] = reduced;

      if (indentation >= context.length) {
        folders.add(context.join("/"));
      }
      context.splice(indentation, Infinity, line.slice(i + "└── ".length));
      files.push({
        name: line.slice(i + "└── ".length),
        webkitRelativePath: context.filter((_, idx) => idx <= indentation).join("/"),
      } as File);
      return reduced;
    },
    [[], [], new Set<string>()] as [string[], File[], Set<string>],
  );

  return files.filter((file) => !folders.has(file.webkitRelativePath));
};
