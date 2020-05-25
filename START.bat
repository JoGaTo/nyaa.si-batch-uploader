@ECHO OFF

IF NOT EXIST node_modules (
    ECHO Installing Node dependencies...
    ECHO This only needs to run once and should only take a few seconds.
    ECHO -------------------------------
    CALL npm install --production --no-optional
    ECHO -------------------------------
)

CALL npm run start

@ECHO ON
