import { AllowedActions } from ".";
export interface WebViewMessages extends AllowedActions {
    getSettings: {
        request: unknown;
        response: string;
    };
}
