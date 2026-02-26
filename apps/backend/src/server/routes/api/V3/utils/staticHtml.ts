import core from "../../../../../utils/core/core";


export const rootDomainHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="10;url=https://sessionsbot.fyi" />
    <title>Sessions Bot - API</title>
    <style>
        body {
            background: #18181b;
            color: #fafafa;
            font-family: sans-serif;
            text-align: center;
            padding-top: 50px;
        }

        #logo {
            width: 50px;
            height: 50px;
            border-radius: 7px;
        }
    </style>
</head>
<body>
    <img id="logo" src='https://sessionsbot.fyi/logo-text.png'>
    <h1> Sessions Bot - API </h1>
    <p> Redirecting to website in 10 seconds...</p>
    ---
    <p> API Version: 3 </p>
    <p> Current Version: ${core.botVersion} </p>
    <p> Current Commit SHA: ${process.env?.['KOYEB_GIT_SHA']?.slice(0, 7) ?? 'unknown'} </p>
    <a href="https://status.sessionsbot.fyi"> Status Page </a>
</body>
</html>
`