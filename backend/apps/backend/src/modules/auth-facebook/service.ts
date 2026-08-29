import crypto from "crypto";
import {
  AbstractAuthModuleProvider,
  MedusaError,
} from "@medusajs/framework/utils";
import type {
  AuthenticationInput,
  AuthenticationResponse,
  AuthIdentityProviderService,
} from "@medusajs/framework/types";

/**
 * Вход через Facebook (OAuth 2, Graph API).
 * Написан по образцу официального @medusajs/auth-google.
 * Требует приложение на developers.facebook.com с разрешением email.
 */

type Options = {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
};

const FB_AUTH_URL = "https://www.facebook.com/v19.0/dialog/oauth";
const FB_TOKEN_URL = "https://graph.facebook.com/v19.0/oauth/access_token";
const FB_ME_URL = "https://graph.facebook.com/v19.0/me";

export class FacebookAuthService extends AbstractAuthModuleProvider {
  static identifier = "facebook";
  static DISPLAY_NAME = "Facebook Authentication";

  protected config_: Options;

  static validateOptions(options: Options) {
    if (!options.clientId) throw new Error("Facebook clientId is required");
    if (!options.clientSecret)
      throw new Error("Facebook clientSecret is required");
    if (!options.callbackUrl)
      throw new Error("Facebook callbackUrl is required");
  }

  constructor(container: Record<string, unknown>, options: Options) {
    // @ts-expect-error — стандартный шаблон конструктора провайдера Medusa
    super(...arguments);
    this.config_ = options;
  }

  async register(_: AuthenticationInput): Promise<AuthenticationResponse> {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Facebook does not support registration. Use method `authenticate` instead."
    );
  }

  async authenticate(
    req: AuthenticationInput,
    authIdentityService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const query = (req.query ?? {}) as Record<string, string>;
    if (query.error) {
      return { success: false, error: query.error_description || query.error };
    }
    const stateKey = crypto.randomBytes(32).toString("hex");
    const body = (req.body ?? {}) as Record<string, string>;
    const state = { callback_url: body.callback_url ?? this.config_.callbackUrl };
    await authIdentityService.setState(stateKey, state);

    const url = new URL(FB_AUTH_URL);
    url.searchParams.set("client_id", this.config_.clientId);
    url.searchParams.set("redirect_uri", state.callback_url);
    url.searchParams.set("state", stateKey);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "email,public_profile");
    return { success: true, location: url.toString() };
  }

  async validateCallback(
    req: AuthenticationInput,
    authIdentityService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const query = (req.query ?? {}) as Record<string, string>;
    const body = (req.body ?? {}) as Record<string, string>;
    if (query.error) {
      return { success: false, error: query.error_description || query.error };
    }
    const code = query.code ?? body.code;
    if (!code) return { success: false, error: "No code provided" };

    const state = await authIdentityService.getState(query.state);
    if (!state) {
      return { success: false, error: "No state provided, or session expired" };
    }

    try {
      const tokenUrl = new URL(FB_TOKEN_URL);
      tokenUrl.searchParams.set("client_id", this.config_.clientId);
      tokenUrl.searchParams.set("client_secret", this.config_.clientSecret);
      tokenUrl.searchParams.set("redirect_uri", state.callback_url as string);
      tokenUrl.searchParams.set("code", code);
      const tokenRes = (await fetch(tokenUrl.toString()).then((r) => {
        if (!r.ok) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Could not exchange token, ${r.status}, ${r.statusText}`
          );
        }
        return r.json();
      })) as { access_token?: string };
      if (!tokenRes.access_token) {
        return { success: false, error: "Facebook did not return access_token" };
      }

      const meUrl = new URL(FB_ME_URL);
      meUrl.searchParams.set("fields", "id,name,email,first_name,last_name");
      meUrl.searchParams.set("access_token", tokenRes.access_token);
      const profile = (await fetch(meUrl.toString()).then((r) => {
        if (!r.ok) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Could not fetch Facebook profile, ${r.status}, ${r.statusText}`
          );
        }
        return r.json();
      })) as {
        id?: string;
        name?: string;
        email?: string;
        first_name?: string;
        last_name?: string;
      };
      if (!profile.id) {
        return { success: false, error: "Facebook profile is missing id" };
      }

      const entity_id = profile.id;
      const userMetadata = {
        name: profile.name,
        email: profile.email,
        given_name: profile.first_name,
        family_name: profile.last_name,
      };

      let authIdentity;
      try {
        authIdentity = await authIdentityService.retrieve({ entity_id });
      } catch (error) {
        const err = error as { type?: string; message?: string };
        if (err.type === MedusaError.Types.NOT_FOUND) {
          authIdentity = await authIdentityService.create({
            entity_id,
            user_metadata: userMetadata,
          });
        } else {
          return { success: false, error: err.message ?? "unknown error" };
        }
      }
      return { success: true, authIdentity };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}
