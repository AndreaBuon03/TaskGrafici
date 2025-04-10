import { Injectable } from '@angular/core';
import * as Papa from 'papaparse';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
export interface CsvData {
  zoneId: string;
  date: string;
  temperature: number;
  humidity: number;
  solarRadiation: number;
  precipitation: number;
  [key: string]: any;
}
@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor() { }
  // Funzione per caricare e parsare il CSV
  importCsv(file: File): Observable<CsvData[]> {
    return new Observable<CsvData[]>(observer => {
        Papa.parse(file, {
            complete: (result) => {
                console.log('CSV Parsing Results:'); // Controlla i dati parseati
                
                // Validazione del CSV
                if (!this.isValidCsv(result.data)) {
                    console.error('Errore: Il file CSV non è valido.');
                    observer.error('Il file CSV non è leggibile o ha una struttura non valida!');
                    return; // Termina il processo
                }

                // Mappa i dati del CSV in formato appropriato
                const parsedData: CsvData[] = result.data.map((row: any) => ({
                    zoneId: row[0], // Prima colonna
                    date: row[1],   // Seconda colonna
                    ...row.slice(2).reduce((acc: { [x: string]: number; }, value: string, index: any) => {
                        acc[`data_${index}`] = parseFloat(value) || 0; // Colonne dinamiche
                        return acc;
                    }, {})
                }));

                observer.next(parsedData);
                observer.complete();
            },
            header: false, // Usa false se il CSV non ha intestazioni
            skipEmptyLines: true
        });
    }).pipe(
        catchError((error): Observable<CsvData[]> => {
            console.error('Errore parsing CSV:', error);
            return of([]);  // Restituisce un array vuoto in caso di errore
        })
    );
}

private isValidCsv(data: any[]): boolean {
  if (data.length < 2) {
      console.error('CSV vuoto o insufficiente numero di righe.');
      return false;
  }

  const headerLength = data[0].length; // Numero di colonne nella prima riga (intestazione)
  if (headerLength < 2) {
      console.error('CSV deve avere almeno due colonne.');
      return false;
  }

  for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length !== headerLength) {
          console.error(`Riga ${i + 1} ha un numero di colonne non corrispondente.`);
          return false; // Struttura errata
      }
      if (row.some((cell: string) => cell.trim() === '')) {
          console.error(`Riga ${i + 1} contiene celle vuote.`);
          return false; // Celle vuote non consentite
      }
  }

  console.log('CSV valido!');
  return true;
}

}