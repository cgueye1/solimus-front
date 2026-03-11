1️⃣ Installer la librairie

Dans ton projet Angular :

npm install crypto-js
npm install --save-dev @types/crypto-js
2️⃣ Fonction pour chiffrer les données
import * as CryptoJS from 'crypto-js';

private secretKey = 'innov-impact-secret-key';

encryptData(data: any): string {
  const jsonString = JSON.stringify(data);

  const encrypted = CryptoJS.AES.encrypt(
    jsonString,
    this.secretKey
  ).toString();

  return encodeURIComponent(encrypted);
}
3️⃣ Fonction pour déchiffrer
decryptData(encrypted: string): any {

  const decoded = decodeURIComponent(encrypted);

  const bytes = CryptoJS.AES.decrypt(decoded, this.secretKey);

  const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

  return JSON.parse(decryptedString);
}
4️⃣ Fonction signDocument

Cette fonction :

prend data

chiffre le JSON

ouvre /admin avec pdfurl

signDocument(data: any): void {

  const encrypted = this.encryptData(data);

  const url = `http://localhost:4200/admin?pdfurl=${encrypted}`;

  window.open(url, '_self');

}
5️⃣ Configuration des routes Angular
import { Routes } from '@angular/router';
import { AppComponent } from './app.component';

export const routes: Routes = [
  {
    path: 'admin',
    component: AppComponent
  },
  {
    path: '',
    redirectTo: '/admin',
    pathMatch: 'full'
  }
];
6️⃣ Récupérer le paramètre dans /admin

Dans ton AppComponent :

import { ActivatedRoute } from '@angular/router';
import * as CryptoJS from 'crypto-js';

private secretKey = 'innov-impact-secret-key';

constructor(private route: ActivatedRoute) {}
7️⃣ Dans ngOnInit
ngOnInit(): void {

  this.route.queryParams.subscribe(params => {

    const encryptedParam = params['pdfurl'];

    if (encryptedParam) {
      try {

        const data = this.decryptData(encryptedParam);

        console.log('JSON récupéré :', data);

        // tu peux utiliser les données ici

      } catch (error) {
        console.error('Erreur de déchiffrement', error);
      }
    }

  });

}
8️⃣ Résultat
