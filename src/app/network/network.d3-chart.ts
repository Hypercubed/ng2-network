import * as d3 from 'd3';
import * as d3tip from 'd3-tip';

export default function Network (opts) {
  opts = opts || {};

  let width = opts.width || 960;
  let height = opts.height || 800;
  const title = opts.title || 'Network';

  const color = d3.scale.category20();

  const force = d3.layout.force()
    .charge(-60)
    .linkDistance(30)
    .size([width, height]);

  const tip = d3tip()
    .attr('class', 'd3-tip animate')
    .offset([-10, 0])
    .html(d => `${d.ip}`);

  const dispatch: any = d3.dispatch('mouseover', 'mouseout', 'contextmenu');

  const chart: any = function chart (selection) {
    selection.each(function (graph) {
      const container = d3.select(this);

      const svg = container.selectAll('svg')
        .data([graph])
        .enter()
        .append('svg')
          .attr('title', title)
          .attr('width', width)
          .attr('height', height);

      svg.call(tip);

      const dataNodes: [any] = graph.nodes.filter(d => d.visible);
      const dataLinks: [any] = graph.links.filter(d => d.target.visible && d.source.visible);

      force
        .size([width, height])
        .nodes(dataNodes)
        .links(dataLinks)
        .start();

      const link = svg.selectAll('.link')
          .data(dataLinks)
        .enter().append('line')
          .attr('class', 'link')
          .style('stroke-width', d => Math.sqrt(d.value));

      const node = svg.selectAll('.node')
          .data(dataNodes)
        .enter().append('circle')
          .attr('class', 'node')
          .attr('r', 5)
          .style('fill', d => color(d.group))
          .on('mouseover', tip.show)
          .on('mouseout', tip.hide)
          .on('mousedown', d => {
            // using mousedown vs. contextmenu because firefox
            const event: any = d3.event;
            if (event.which === 3) {  // right click
              event.preventDefault();
              return dispatch.contextmenu.call(container, event, d);
            }
            return dispatch.contextmenu.call(container, event, null);
          })
          .on('contextmenu', d => {
            const e: any = d3.event;
            e.preventDefault();
          })
          .call(force.drag);

      container.on('click', () => {
        const e: any = d3.event;
        e.preventDefault();
        return dispatch.contextmenu.call(container, d3.event, null);
      });

      node.append('title')
        .text(d => d.name);

      force.on('tick', () => {
        link.attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node.attr('cx', d => d.x)
            .attr('cy', d => d.y);
      });
    });
  };

  chart.width = function (_) {
    if (arguments.length < 1) {
      return width;
    }
    width = _;
    return chart;
  };

  d3.rebind(chart, dispatch, 'on');

  return chart;
}
