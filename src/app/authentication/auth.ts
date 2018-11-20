// ------------------------------------------------------------------------------
//  Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
// See License in the project root for license information.
// ------------------------------------------------------------------------------

import { AppComponent } from '../app.component';
import { deleteHistoryFromLocalStorage } from '../history';
export async function haveValidAccessToken(authService) {
  const token = await authService.getTokenSilent();
  if (token) {
    return true;
  }
  return false;
}

export function localLogout() {
  // Anonymous users can only GET
  AppComponent.explorerValues.selectedOption = 'GET';
  AppComponent.explorerValues.authentication.user = {};
  deleteHistoryFromLocalStorage();
  localStorage.setItem('status', 'anonymous');
  sessionStorage.clear();
}

export async function checkHasValidAuthToken(authService) {
  const valid = await haveValidAccessToken(authService);
  const authenticated = isAuthenticated();
  if (!valid && authenticated) {
    localLogout();
  }
}

export function isAuthenticated() {
  const status = localStorage.getItem('status');
  if (status && status !== 'anonymous') {
    return true;
  }
  localStorage.setItem('status', 'anonymous');
  return false;
}

// tslint:disable-next-line:only-arrow-functions
(window as any).tokenPlease = async function() {
  const accessToken = await this.authService.getTokenSilent();
  if (accessToken) {
    return accessToken;
  } else {
    // tslint:disable-next-line:no-console
    console.log('Please sign in to get your access token');
  }
};
