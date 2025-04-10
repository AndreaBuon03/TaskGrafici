import { Component, OnInit } from '@angular/core';
import { DataService, CsvData } from './data.service';
import { Chart, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, LineController } from 'chart.js';
import { CommonModule } from '@angular/common';
@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule]
})
export class AppComponent implements OnInit {
  weatherData: CsvData[] = [];
  filteredData: CsvData[] = [];
  zones: { id: string, name: string }[] = [];
  selectedZone: string = '';
  chartInstances: { [key: string]: Chart | null } = {
    temperature: null,
    humidity: null,
    solarRadiation: null,
    precipitation: null
  };
  constructor(private dataService: DataService) {
    Chart.register(
      CategoryScale,
      LinearScale,
      LineElement,
      PointElement,
      Title,
      Tooltip,
      Legend,
      LineController
    );
  }
  ngOnInit(): void {
    console.log("tutto ok ");
    // Imposta il filtro giornaliero come predefinito
  document.getElementById('dailyControls')!.style.display = 'block';
  document.getElementById('monthlyControls')!.style.display = 'none';
  // Aggiungi eventuali altre logiche iniziali
  }
  importCsv(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.dataService.importCsv(file).subscribe((data: CsvData[]) => {
        this.weatherData = data;
        this.filteredData = data;
        this.zones = [
          { id: '0b13c64b-08ff-4a61-985f-2b44b23c7c45', name: 'zona1' },
          { id: '7e7dd09c-a8ee-414d-b138-c058a3a3066e', name: 'zona2' }
        ];
        this.createCharts(); // Crea i grafici dopo aver ricevuto i dati
      });
    }
  }
  filterByZone(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedZone = selectElement.value;
    this.filteredData = this.weatherData.filter(data => data.zoneId === this.selectedZone);
    console.log('DEBUG - Filtered Data:', this.filteredData);
    this.createCharts(); // Aggiorna i grafici con i dati filtrati
  }
  applyDateFilter() {
    const selectedDate = (document.getElementById('dailyDate') as HTMLInputElement).value;
    if (selectedDate) {
      // Converte la data selezionata in un oggetto Date (formato YYYY-MM-DD)
      const selectedDateObj = new Date(selectedDate);
      // Filtra i dati per la data selezionata
      this.filteredData = this.weatherData.filter(data => {
        // Converti la data del CSV (formato "DD/MM/YYYY HH:mm") a "YYYY-MM-DD"
        const dataDate = this.convertCsvDateToIso(data.date);
        // Normalizza la data selezionata in formato "YYYY-MM-DD"
        const formattedSelectedDate = selectedDateObj.toISOString().split('T')[0]; // "YYYY-MM-DD"
        console.log('Data dal CSV (normalizzata):', dataDate);
        console.log('Data selezionata (normalizzata):', formattedSelectedDate);
        // Confronta solo la parte della data (anno, mese, giorno)
        return dataDate === formattedSelectedDate;
      });
      console.log('Dati filtrati per giorno:', this.filteredData);
      this.createCharts();  // Ricrea i grafici con i dati filtrati
    }
  }
  applyDateRangeFilter() {
    const startDate = (document.getElementById('startDate') as HTMLInputElement).value;
    const endDate = (document.getElementById('endDate') as HTMLInputElement).value;
    if (startDate && endDate) {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      if (startDateObj > endDateObj) {
        alert('La data di inizio deve essere precedente alla data di fine!');
        return;
      }
      // Filtra i dati per l'intervallo di date selezionato
      this.filteredData = this.weatherData.filter(data => {
        const dataDate = this.convertCsvDateToIso(data.date);
        const dataDateObj = new Date(dataDate);
        // Controlla se la data è compresa nell'intervallo
        return dataDateObj >= startDateObj && dataDateObj <= endDateObj;
      });
      console.log('Dati filtrati per intervallo di date:', this.filteredData);
      this.createCharts(); // Ricrea i grafici con i dati filtrati
    }
  }
  // Funzione per convertire la data del CSV (DD/MM/YYYY HH:mm) in formato YYYY-MM-DD
  convertCsvDateToIso(csvDate: string): string {
    // Estrai la parte della data e ignoriamo l'orario
    const [datePart] = csvDate.split(' ');  // Ottieni solo "DD/MM/YYYY"
    const [day, month, year] = datePart.split('/');  // Estrai giorno, mese e anno
    // Ritorna la data in formato "YYYY-MM-DD"
    return `${year}-${month}-${day}`;
  }
  applyMonthFilter() {
    const selectedMonth = (document.getElementById('monthSelect') as HTMLSelectElement).value;
    if (selectedMonth) {
      // Filtra i dati per il mese selezionato
      this.filteredData = this.weatherData.filter(data => {
        const dataDate = this.convertCsvDateToIso(data.date);  // Converti la data del CSV
        const [dataYear, dataMonth] = dataDate.split('-');  // Estrai anno e mese
        // Confronta solo anno e mese
        return dataMonth === selectedMonth;
      });
      console.log('Dati filtrati per mese:', this.filteredData);
      this.createCharts();  // Ricrea i grafici con i dati filtrati
    }
  }
  changePeriod(event: Event) {
    const selectedPeriod = (event.target as HTMLSelectElement).value;
    // Mostra/nascondi i controlli in base alla selezione
    if (selectedPeriod === 'daily') {
      document.getElementById('dailyControls')!.style.display = 'block';
      document.getElementById('monthlyControls')!.style.display = 'none';
    } else if (selectedPeriod === 'monthly') {
      document.getElementById('dailyControls')!.style.display = 'none';
      document.getElementById('monthlyControls')!.style.display = 'block';
    }
  }
   
  getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  
 createCharts() {
    // Distruggi i grafici esistenti
    for (const key in this.chartInstances) {
        if (this.chartInstances[key]) {
            this.chartInstances[key]?.destroy();
            this.chartInstances[key] = null;
        }
    }
    // Pulisci il contenitore dei grafici
    const container = document.getElementById('chartContainer');
    if (container) {
        container.innerHTML = ''; // Pulisce il contenitore dei grafici
    }
    // Ottieni le chiavi dei dati (escludendo 'zoneId' e 'date')
    const dataKeys = Object.keys(this.filteredData[0]).filter(key => key !== 'date' && key !== 'zoneId');
    // Itera su ogni chiave per generare i grafici
    dataKeys.forEach((key, index) => {
        const values = this.filteredData.map(d => d[key]); // Valori principali
        const minValues = this.filteredData.map(d => d[`min${key.charAt(0).toUpperCase() + key.slice(1)}`]); // Valori minimi
        const maxValues = this.filteredData.map(d => d[`max${key.charAt(0).toUpperCase() + key.slice(1)}`]); // Valori massimi
        // Aggiungi i console.log per il debug
        console.log(`Key: ${key}`);
        console.log(`Valori principali:`, values);
        console.log(`Valori minimi:`, minValues);
        console.log(`Valori massimi:`, maxValues);
        // Crea un ID unico per il grafico
        const chartId = `chart_${index}`;
        // Crea dinamicamente un elemento canvas
        const canvas = document.createElement('canvas');
        canvas.id = chartId;
        container?.appendChild(canvas);
        // Crea il grafico dinamico
        new Chart(canvas, {
            type: 'line',
            data: {
                labels: this.filteredData.map(d => d.date), // Asse X con le date
                datasets: [
                    {
                        label: key, // Dati principali
                        data: values,
                        borderColor: this.getRandomColor(),
                        fill: false
                    },
                    {
                        label: `Min ${key}`, // Valori minimi
                        data: minValues,
                        borderColor: 'red',
                        borderDash: [5, 5], // Linea tratteggiata per distinguere
                        fill: false
                    },
                    {
                        label: `Max ${key}`, // Valori massimi
                        data: maxValues,
                        borderColor: 'green',
                        borderDash: [5, 5], // Linea tratteggiata per distinguere
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: { title: { display: true, text: 'Data' } },
                    y: { title: { display: true, text: key } }
                }
            }
        });
    });
}

}