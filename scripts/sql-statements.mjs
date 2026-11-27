/** Count top-level SQL statements, preserving dollar-quoted function bodies. */
export function statementCount(sql) {
  let index = 0,
    count = 0,
    pending = false;
  while (index < sql.length) {
    if (/\s/.test(sql[index])) {
      index++;
      continue;
    }
    if (sql.startsWith("--", index)) {
      const end = sql.indexOf("\n", index);
      index = end < 0 ? sql.length : end + 1;
      continue;
    }
    if (sql.startsWith("/*", index)) {
      let depth = 1;
      index += 2;
      while (index < sql.length && depth) {
        if (sql.startsWith("/*", index)) {
          depth++;
          index += 2;
        } else if (sql.startsWith("*/", index)) {
          depth--;
          index += 2;
        } else index++;
      }
      if (depth) throw new Error("Unclosed SQL comment");
      continue;
    }
    if (sql[index] === ";") {
      if (pending) count++;
      pending = false;
      index++;
      continue;
    }
    pending = true;
    const tag = sql.slice(index).match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/)?.[0];
    if (tag) {
      const end = sql.indexOf(tag, index + tag.length);
      if (end < 0) throw new Error("Unclosed SQL function body");
      index = end + tag.length;
      continue;
    }
    if (sql[index] === "'" || sql[index] === '"') {
      const quote = sql[index++];
      let closed = false;
      while (index < sql.length) {
        if (sql[index] === quote) {
          index++;
          if (sql[index] === quote) {
            index++;
            continue;
          }
          closed = true;
          break;
        }
        index++;
      }
      if (!closed) throw new Error("Unclosed SQL string");
      continue;
    }
    index++;
  }
  return count + (pending ? 1 : 0);
}
