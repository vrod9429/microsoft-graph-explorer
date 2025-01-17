// ------------------------------------------------------------------------------
//  Copyright (c) Microsoft Corporation.  All Rights Reserved.  Licensed under the MIT License.
// See License in the project root for license information.
// ------------------------------------------------------------------------------

import { ChangeDetectorRef, Component } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AppComponent } from '../app.component';
import { GraphService } from '../graph-service';
import { GraphExplorerComponent } from '../GraphExplorerComponent';
import { PermissionScopes } from '../scopes-dialog/scopes';
import { ScopesDialogComponent } from '../scopes-dialog/scopes-dialog.component';
import { getGraphUrl } from '../util';
import { haveValidAccessToken, localLogout } from './auth';
import { getScopes, getTokenSilent, isAccountExpired, login, logout } from './auth.service';

@Component({
  selector: 'authentication',
  styleUrls: ['./authentication.component.css'],
  templateUrl: './authentication.component.html',
})

export class AuthenticationComponent extends GraphExplorerComponent {

  public authInfo = this.explorerValues.authentication;

  constructor(private sanitizer: DomSanitizer, private apiService: GraphService,
              private changeDetectorRef: ChangeDetectorRef) {
    super();
  }

  public async ngOnInit() {
    AppComponent.explorerValues.authentication.status = 'anonymous';
    const accountHasExpired = isAccountExpired();
    if (accountHasExpired) {
      return AppComponent.explorerValues.authentication.status = 'anonymous';
    }

    AppComponent.explorerValues.authentication.status = 'authenticating';

    return getTokenSilent()
      .then(() => {
        AppComponent.explorerValues.authentication.status = 'authenticated';
        this.displayUserProfile();
        this.setPermissions();
      }).catch((error) => {
        // tslint:disable-next-line
        console.log(error);
        AppComponent.explorerValues.authentication.status = 'anonymous';
      });
  }

  public sanitize(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  public async login() {
    AppComponent.explorerValues.authentication.status = 'authenticating';

    try {
        await login();
    } catch (error) {
      AppComponent.explorerValues.authentication.status = 'anonymous';
    }
  }

  public logout() {
    localLogout();
    logout();
  }

  public getAuthenticationStatus() {
    return AppComponent.explorerValues.authentication.status;
  }

  public manageScopes() {
    ScopesDialogComponent.showDialog();
  }

  public async setPermissions() {
    const scopes = await getScopes();
    const scopesLowerCase = scopes.map((item) => {
        return item.toLowerCase();
    });
    scopesLowerCase.push('openid');
    for (const scope of PermissionScopes) {
      // Scope.consented indicates that the user or admin has previously consented to the scope.
      scope.consented = scopesLowerCase.indexOf(scope.name.toLowerCase()) !== -1;
    }
  }

  private async displayUserProfile() {
    try {
      const userInfoUrl = `${getGraphUrl()}/v1.0/me`;
      const userPictureUrl = `${getGraphUrl()}/beta/me/photo/$value`;
      const userInfo = await this.apiService.performQuery('GET', userInfoUrl);
      const jsonUserInfo = userInfo.json();

      AppComponent.explorerValues.authentication.user.displayName = jsonUserInfo.displayName;
      AppComponent.explorerValues.authentication.user.emailAddress
      = jsonUserInfo.mail || jsonUserInfo.userPrincipalName;

      try {
        const userPicture = await this.apiService.performQuery('GET_BINARY', userPictureUrl);
        const blob = new Blob([userPicture.arrayBuffer()], { type: 'image/jpeg' });
        const imageUrl = window.URL.createObjectURL(blob);

        AppComponent.explorerValues.authentication.user.profileImageUrl = imageUrl;
      } catch (e) {
        AppComponent.explorerValues.authentication.user.profileImageUrl = null;
      }
      AppComponent.explorerValues.authentication.status = 'authenticated';
      this.changeDetectorRef.detectChanges();

    } catch (e) {
      localLogout();
    }
  }
}
