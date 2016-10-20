declare var d3: any;
declare var THREE: any;

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Http, Response } from '@angular/http';

import 'rxjs/Rx';

import threeChart from './network/network.three-chart';
import d3Chart from './network/network.d3-chart';

const chartConstructors = {
  'three.js': threeChart,
  d3: d3Chart
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
  filter = { ip: '' };
  data = {
    nodes: [],
    links: []
  };
  charts = Object.keys(chartConstructors);
  selectedChart: string = 'three.js';
  selected = null;
  chart = null;
  contextMenu = null;
  container = null;

  constructor (private http: Http) {};

  ngOnInit() {
    // Using d3 here is bad, replace with an ng2 directive
    this.contextMenu = d3.select('#node-context-menu');
    this.container = d3.select('#_network__chart');

    return this.http
      .get('./assets/ip-network.json')
      .toPromise()
      .then((res: Response) => {
        this.data = processData(res.json());
        this.makeChart();
      });
      // todo: catch error
  }

  makeChart() {
    this.chart = chartConstructors[this.selectedChart]({});
    this.chart.on('contextmenu', (event, d) => {
      if (d) {
        this.contextMenu
          .classed('open', true)
          .style('position', 'absolute')
          .style('top', `${event.clientY + 10}px`)
          .style('left', `${event.clientX}px`);
        this.selected = d;
      } else {
        this.contextMenu
          .classed('open', false);
      }
    });
    this.update();
  }

  geoLocate(ip) {
    this.contextMenu
      .classed('open', false);

    return this.http
      .get(`http://ip-api.com/json/${ip}`)
      .toPromise()
      .then((res: Response) => {
        const data = res.json();
        if (data.lat && data.lon) {
          const url = `http://maps.google.com/?q=${data.lat},${data.lon}`;
          if (confirm(`Open ${url} ?`)) {
            window.open(url, '_blank');
          }
        } else {
          alert('Unknown IP address');
        }
      })
      .catch(() => {
        alert('Error loading data from ip-api.com');
      });
      // todo: catch error
  }

  applyFilter () {
    let fn = d => {
      d.visible = true;
    };

    const ip = this.filter.ip;
    if (ip && ip.length > 0) {
      fn = d => {
        d.visible = d.ip.indexOf(ip) > -1;
      };
    }

    this.data.nodes.forEach(fn);
    this.update();
  }

  update() {
    const width = this.container[0][0].clientWidth;

    this.container.selectAll('div').remove();

    const divs = this.container
      .selectAll('div')
      .data([this.data]);

    divs.enter().append('div');

    divs.exit().remove();

    divs.call(this.chart.width(width));
  }
}

function processData (data) {
  const nodes = data.nodes.map((d, id) => {
    return {
      group: d.ip.slice('.')[0],
      ip: d.ip,
      id,
      outdegree: 0,
      indegree: 0,
      visible: true
    };
  });

  const links = data.links.map(d => {
    const source = nodes[d.source];
    const target = nodes[d.target];

    source.outdegree++;
    source.degree++;

    target.indegree++;
    target.degree++;

    return {
      value: d.value,
      source: nodes[d.source],
      target: nodes[d.target]
    };
  });

  return {
    nodes,
    links
  };
}
