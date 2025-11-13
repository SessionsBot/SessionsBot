import express from 'express';


const koyebRouter = express.Router({ mergeParams: true })

// Testing koyeb env vars
koyebRouter.get('/env', async (req, res) => {
    const SHA = process.env?.['KOYEB_GIT_SHA'];
    const GIT_BRANCH = process.env?.['KOYEB_GIT_BRANCH'];
    const GIT_REPOSITORY = process.env?.['KOYEB_GIT_REPOSITORY'];
    const COMMIT_AUTHOR = process.env?.['KOYEB_GIT_COMMIT_AUTHOR'];

    const INSTANCE_ID = process.env?.['KOYEB_INSTANCE_ID'];
    const DATA_CENTER = process.env?.['KOYEB_DC'];
    const REGION = process.env?.['KOYEB_REGION'];

    res.send({ git: { SHA, GIT_REPOSITORY, GIT_BRANCH, COMMIT_AUTHOR }, koyeb: { INSTANCE_ID, DATA_CENTER, REGION } })
})