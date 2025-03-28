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
  title(title: any) {
    throw new Error('Method not implemented.');
  }
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
  }

  // Funzione per espandere il grafico
  expandChart(chartId: string): void {
    console.log('Expanding chart:', chartId);  // Debug
    const originalCanvas = document.getElementById(chartId) as HTMLCanvasElement;
    const expandedCanvas = document.getElementById('expandedChart') as HTMLCanvasElement;
    const overlay = document.getElementById('chartOverlay');

    // Set new dimensions for the expanded canvas
    expandedCanvas.width = originalCanvas.width * 1.5;
    expandedCanvas.height = originalCanvas.height * 1.5;

    const ctx = expandedCanvas.getContext('2d');
    ctx?.drawImage(originalCanvas, 0, 0, expandedCanvas.width, expandedCanvas.height);

    // Display the overlay
    overlay!.style.display = 'flex';
  }

  // Funzione per chiudere il grafico
  closeChart(): void {
    document.getElementById('chartOverlay')!.style.display = 'none';
  }

  // Importa i dati CSV
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

  // Filtra i dati in base alla zona
  filterByZone(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedZone = selectElement.value;
    this.filteredData = this.weatherData.filter(data => data.zoneId === this.selectedZone);
    console.log('DEBUG - Filtered Data:', this.filteredData);
    this.createCharts(); // Aggiorna i grafici con i dati filtrati
  }

  // Crea i grafici
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

    // Crea i grafici per temperatura, umidità, radiazione solare e precipitazioni
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

    // Ripeti per gli altri grafici (umidità, radiazione solare, precipitazioni)
    // ...
  }
}
