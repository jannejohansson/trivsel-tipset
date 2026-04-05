'use strict';

// Entry point — explicitly require all function files so Azure Functions
// runtime discovers them regardless of glob support.
require('./functions/sendMagicLink');
require('./functions/verifyToken');
require('./functions/requestAccess');
require('./functions/handleRequest');
require('./functions/getMatches');
require('./functions/savePrediction');
require('./functions/getLeaderboard');
