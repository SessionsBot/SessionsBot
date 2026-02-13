export { }

declare global {
    // gtag - google analytics
    interface Window {
        dataLayer: unknown[];
        gtag: (...args: any[]) => void;
    }

    // gtag - google analytics
    const gtag: (...args: any[]) => void;
}
