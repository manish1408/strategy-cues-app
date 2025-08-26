import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Color, LegendPosition, ScaleType } from '@swimlane/ngx-charts';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  loading: boolean = false;
  chart: any = [];
  user: any;
  recognitionRate: any;
  stats: any;
  $destroyWatching: Subject<any> = new Subject();
  selectedChatbot: any;
  id: string | null = null;
  trainingPercentage: number = 0;
  trainingChartData: any[] = [];
  intentsChartData: any[] = [];
  recognitionChartData: any[] = [];
  view: [number, number] = [600, 380];
  view2: [number, number] = [900, 380];

  // chart options
  gradient: boolean = true;
  showLegendPie: boolean = false;
  showLegend: boolean = false;
  showLabels: boolean = true;
  isDoughnut: boolean = true;
  showXAxis: boolean = true;
  showYAxis: boolean = true;
  showXAxisLabel: boolean = true;
  yAxisLabel: string = 'Number of queries';
  showYAxisLabel: boolean = true;
  xAxisLabel: string = 'Date';
  legendPosition: LegendPosition = LegendPosition.Right;
  activeItem: string = '7'; // Default active item
  recognitionNull = false;
  feedbackChartData: any[] = [];
  feedbackColorScheme: Color = {
    name: 'feedbackScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#5DD89D', '#072032', '#FFF59F', '#89FFBA', '#12715B'],
  };
  feedbackNull = true;

  customColorScheme: Color = {
    name: 'customScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#5DD89D', '#072032', '#FFF59F', '#89FFBA', '#12715B'],
  };
  customColorSchemeBar: Color = {
    name: 'customScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#5DD89D', '#072032', '#FFF59F', '#89FFBA', '#12715B'],
  };

  constructor(
    private route: ActivatedRoute,
    private titleService: Title,
    private router: Router
  ) {
    this.titleService.setTitle('Dashboard: MiloAssistant.ai');
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if(params['id']){
        this.id = params['id'];
      }
      this.getStats();
    });
  }

  getStats() {
    this.loading = true;
    // Simulate fetching stats with static data
    setTimeout(() => {
      this.stats = {
        trainingFiles: 250,
        topIntents: {
          'Intent A': 30,
          'Intent B': 50,
          'Intent C': 20
        },
        recognitionRate: {
          data: {
            datasets: [{
              data: [
                { id: 'Recognized', nested: { value: 70 } },
                { id: 'Unrecognized', nested: { value: 30 } }
              ]
            }]
          }
        }
      };
      this.setChartData();
      this.loading = false;
    }, 1000);
  }

  // charts events
  onSelect(data: any): void {
  }

  onActivate(data: any): void {
  }

  onDeactivate(data: any): void {
  }

  setChartData() {
    if (this.stats?.trainingFiles) {
      this.trainingPercentage = (this.stats?.trainingFiles / 500) * 100;
      this.trainingChartData = [
        {
          name: 'Achieved',
          value: this.stats?.trainingFiles,
        },
        {
          name: 'Remaining',
          value: 500 - this.stats?.trainingFiles,
        },
      ];
    }
    if (this.stats?.topIntents) {
      for (var key of Object.keys(this.stats.topIntents)) {
        this.intentsChartData.push({
          name: key,
          value: Number(this.stats.topIntents[key]),
        });
      }
    }
    if (this.stats?.recognitionRate?.data?.datasets?.length) {
      this.stats.recognitionRate.data.datasets[0].data.forEach((data: any) => {
        this.recognitionChartData.push({
          name: data.id,
          value: Number(data.nested.value),
        });
      });
    }
    try {
      if (
        this.recognitionChartData[0]?.value == 0 &&
        this.recognitionChartData[1]?.value == 0
      ) {
        this.recognitionNull = true;
      }
    } catch (error) {}
  }

  // for static value bind
  setActive(item: string): void {
    this.activeItem = item;

    const intentsChartNames = this.intentsChartData.map((x) => x.name);
    const recognitionChartNames = this.recognitionChartData.map((x) => x.name);
    this.intentsChartData = [];
    this.recognitionChartData = [];

    intentsChartNames.forEach((intent: any) => {
      this.intentsChartData.push({
        name: intent,
        value: Math.floor(Math.random() * (100 - 10 + 1)) + 10,
      });
    });

    recognitionChartNames.forEach((rec: any) => {
      this.recognitionChartData.push({
        name: rec,
        value: Math.floor(Math.random() * (100 - 10 + 1)) + 10,
      });
    });
  }

  // Doughnut
  public doughnutChartLabels: string[] = [
    'Download Sales',
    'In-Store Sales',
    'Mail-Order Sales',
  ];
  resizeChart(width: any): void {
    this.view = [width, 380];
  }
  resizeChart2(width: any): void {
    this.view2 = [width - 100, 380];
  }
  goTo() {
    this.router.navigate(['/unanswered-questions'], {
      queryParams: { id: this.id }
    });
  }
}
