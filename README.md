

sudo chown -R wakana:wakana /var/www/
sudo nano /etc/nginx/sites-available/solimus.sn

scp -r dist/gestionimmovefa  root@94.176.182.149:/var/www/

  
MGe21bc203b6feb4a38bc5a5daa7f540a3


ng g c back-office/payment/prescription-payment --standalone


http://localhost:4200/#/payment-redirect/subId/uId/1500000/Installation

http://localhost:4200/#/payment-redirect/23/79/1500000/Installation


https://solimus.sn/#/payment-redirect/40/89/1000.0/1



ng build --configuration production




pour le pdf
ng build --configuration production --base-href /pdf/






// Dans votre composant parent
export class ParentComponent {
  googleMapsApiKey = 'VOTRE_CLE_API';
  
  // Données existantes pour la modification
  existingLocation: LocationData = {
    name: 'Dakar',
    address: 'Dakar, Sénégal',
    latitude: 14.716677,
    longitude: -17.467686,
    placeId: '...'
  };
  
  // Ou simplement une adresse textuelle
  existingAddress = 'Dakar, Sénégal';
  
  onLocationSelected(location: LocationData | null) {
    if (location) {
      console.log('Lieu sélectionné:', location);
      // Traiter les données du lieu
    } else {
      console.log('Lieu effacé');
    }
  }
}





ng build --configuration production


ng serve --port 55938# solimus-front
