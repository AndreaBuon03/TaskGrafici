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
          // Mappa i dati del CSV in formato appropriato
          const parsedData: CsvData[] = result.data.map((row: any) => ({
            zoneId: row[0],
            date: row[1],
            temperature: parseFloat(row[2]),
            humidity: parseFloat(row[3]),
            solarRadiation: parseFloat(row[4]),
            precipitation: parseFloat(row[5]),
          }));
          observer.next(parsedData);
          observer.complete();
        },
        header: false,
        skipEmptyLines: true
      });
    }).pipe(
      catchError((error): Observable<CsvData[]> => {
        console.error('Errore parsing CSV:', error);
        return of([]);  // Restituisce un array vuoto in caso di errore
      })
    );
  }
}