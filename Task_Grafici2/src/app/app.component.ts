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
  createCharts() {
    // Distruggi i grafici esistenti se presenti
    for (const key in this.chartInstances) {
      if (this.chartInstances[key]) {
        this.chartInstances[key]?.destroy();
      }
    }
    const dates = this.filteredData.map(d => d.date);
    const temperatures = this.filteredData.map(d => d.temperature);
    const humidity = this.filteredData.map(d => d.humidity);
    const solarRadiation = this.filteredData.map(d => d.solarRadiation || 0);
    const precipitation = this.filteredData.map(d => d.precipitation || 0);
    // Crea il grafico della temperatura
    this.chartInstances['temperature'] = new Chart('temperatureChart', {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Temperatura (°C)',
          data: temperatures,
          borderColor: 'rgba(75, 192, 192, 1)',
          fill: false
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: 'Data' } },
          y: { title: { display: true, text: 'Temperatura (°C)' } }
        }
      }
    });
    // Crea il grafico dell'umidità
    this.chartInstances['humidity'] = new Chart('humidityChart', {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Umidità (%)',
          data: humidity,
          borderColor: 'rgba(153, 102, 255, 1)',
          fill: false
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: 'Data' } },
          y: { title: { display: true, text: 'Umidità (%)' } }
        }
      }
    });
     // Crea il grafico della radiazione solare
    this.chartInstances['solarRadiation'] = new Chart('radiationChart', {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Radiazione Solare (W/m²)',
          data: solarRadiation,
          borderColor: 'rgba(255, 159, 64, 1)',
          fill: false
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: 'Data' } },
          y: { title: { display: true, text: 'Radiazione Solare (W/m²)' } }
        }
      }
    });
    // Crea il grafico delle precipitazioni
    this.chartInstances['precipitation'] = new Chart('precipitationChart', {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Precipitazioni (mm)',
          data: precipitation,
          borderColor: 'rgba(255, 99, 132, 1)',
          fill: false
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: 'Data' } },
          y: { title: { display: true, text: 'Precipitazioni (mm)' } }
        }
      }
    });
  }
}