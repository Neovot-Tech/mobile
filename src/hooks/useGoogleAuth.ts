import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useAuthRequest, makeRedirectUri, ResponseType } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { exchangeGoogleTokenForFirebase } from '../services/googleAuth';
import { signInWithGoogle } from '../services/auth.service';
import { useAuthStore, UserRole } from '../store/auth.store';
import { getApiErrorMessage } from '../services/http';

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = '39833267488-emmsse8idiftaqfocgc7locquj17cbl1.apps.googleusercontent.com';

// Google's OAuth 2.0 authorization endpoint — only needed for the implicit token flow.
const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
};

// On web the redirect is the page origin (no proxy, no custom scheme).
// On native we always use the auth.expo.io proxy — custom schemes (neovot://) are not
// HTTPS URIs and Google's OAuth policy rejects them on web OAuth clients.
// Production native builds will switch to iosClientId/androidClientId in Phase 6.
const isWeb = Platform.OS === 'web';

const redirectUri = makeRedirectUri(
  isWeb ? {} : { scheme: 'neovot' },
);

export function useGoogleAuth(role: UserRole) {
  const { signIn, beginOnboarding } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ResponseType.Token (implicit access_token flow) requires no platform-specific client IDs,
  // works identically in Expo Go, web PWA, and production native via the proxy / page origin.
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: WEB_CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: ResponseType.Token,
      usePKCE: false,
    },
    GOOGLE_DISCOVERY,
  );

  useEffect(() => {
    if (response?.type !== 'success') {
      if (response?.type === 'error') {
        setError(response.error?.message ?? 'Google sign-in was cancelled or failed.');
      }
      return;
    }

    const accessToken = response.params.access_token;
    if (!accessToken) {
      setError('No access token returned from Google.');
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { idToken, refreshToken } = await exchangeGoogleTokenForFirebase(
          accessToken,
          redirectUri,
        );
        const result = await signInWithGoogle({ idToken, refreshToken, role });
        const { user, tokens } = result;

        // Route on the server-confirmed role, not the role the user selected.
        if (result.user.role === 'neo_senior') {
          const onboarding = result.seniorOnboarding!;
          if (onboarding === 'ready') {
            await signIn(user, tokens);
          } else {
            await beginOnboarding(user, tokens, onboarding);
          }
        } else {
          if (result.created) {
            await beginOnboarding(user, tokens);
          } else {
            await signIn(user, tokens);
          }
        }
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [response]);

  return {
    googleLoading: loading || !request,
    googleError: error,
    clearGoogleError: () => setError(null),
    promptGoogleSignIn: () => promptAsync(),
  };
}
