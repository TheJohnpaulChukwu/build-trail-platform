import test from "node:test";
import assert from "node:assert/strict";
import { statementCount } from "./sql-statements.mjs";
test("counts DDL and ignores semicolons inside function bodies and strings", () => {
  assert.equal(
    statementCount(
      "create function f() returns void as $$ begin perform 1; perform 2; end; $$ language plpgsql;",
    ),
    1,
  );
  assert.equal(
    statementCount("select ';', 'it''s;safe', \"semi;colon\"; select 2;"),
    2,
  );
  assert.equal(
    statementCount("-- leading;\n/* outer /* nested; */ */ select 1"),
    1,
  );
  assert.equal(statementCount("/* only comment; */"), 0);
  assert.equal(statementCount("do $body$ begin null; end; $body$;"), 1);
});
test("rejects malformed lexical boundaries", () => {
  for (const sql of ["select 'missing", "do $$ missing", "/* missing"])
    assert.throws(() => statementCount(sql));
});
