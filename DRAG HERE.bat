@ECHO OFF

CD %0\..
CALL node index.js %*

pause

@ECHO ON
