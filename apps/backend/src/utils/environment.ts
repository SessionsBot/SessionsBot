const env_environment = process.env?.['ENVIRONMENT'];
type ENVIRONMENT_TYPE = 'production' | 'development' | 'api_only';


let env: ENVIRONMENT_TYPE = 'development'
switch (env_environment) {
    case 'production':
        env = 'production'
        break;
    case 'api_only':
        env = 'api_only'
        break;
    default:
        env = 'development'
        break;
};

export const ENVIRONMENT_TYPE = env;

