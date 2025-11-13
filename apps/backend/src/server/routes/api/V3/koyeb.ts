import express from 'express';


const koyebRouter = express.Router({ mergeParams: true })

// Testing koyeb env vars
koyebRouter.get('/env', async (req, res) => {
    const gitVars = {
        SHA: process.env?.['KOYEB_GIT_SHA'],
        GIT_BRANCH: process.env?.['KOYEB_GIT_BRANCH'],
        GIT_REPOSITORY: process.env?.['KOYEB_GIT_REPOSITORY'],
        COMMIT_AUTHOR: process.env?.['KOYEB_GIT_COMMIT_AUTHOR'],
    }
    const koyebVars = {
        INSTANCE_ID: process.env?.['KOYEB_INSTANCE_ID'],
        DATA_CENTER: process.env?.['KOYEB_DC'],
        REGION: process.env?.['KOYEB_REGION'],
        REGION_DEPLOYMENT_ID: process.env?.['KOYEB_REGIONAL_DEPLOYMENT_ID'],
        KOYEB_HYPERVISOR_ID: process.env?.['KOYEB_HYPERVISOR_ID'],
    }

    res.send({ git: gitVars, koyeb: koyebVars });

})


export default koyebRouter