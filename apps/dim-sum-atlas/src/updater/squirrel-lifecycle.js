'use strict';

const SQUIRREL_LIFECYCLE_ARGS = Object.freeze(new Set([
  '--squirrel-install',
  '--squirrel-updated',
  '--squirrel-uninstall',
  '--squirrel-obsolete'
]));

function handleSquirrelLifecycle(argv = process.argv, { quit = () => {} } = {}) {
  const argument = argv.find((value) => SQUIRREL_LIFECYCLE_ARGS.has(value));
  if (!argument) return false;
  quit(argument);
  return true;
}

module.exports = { SQUIRREL_LIFECYCLE_ARGS, handleSquirrelLifecycle };
