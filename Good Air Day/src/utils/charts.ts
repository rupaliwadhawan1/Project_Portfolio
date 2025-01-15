import * as d3 from 'd3';

export const createLineChart = (
  element: SVGSVGElement,
  data: { timestamp: string; value: number }[],
  options = {}
) => {
  const margin = { top: 20, right: 30, bottom: 30, left: 40 };
  const width = element.clientWidth - margin.left - margin.right;
  const height = element.clientHeight - margin.top - margin.bottom;

  const svg = d3.select(element);
  svg.selectAll("*").remove();

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => new Date(d.timestamp)) as [Date, Date])
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value) || 0])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const line = d3.line<typeof data[0]>()
    .x(d => x(new Date(d.timestamp)))
    .y(d => y(d.value));

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  const path = svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", line);

  // Add transitions
  const pathLength = path.node()?.getTotalLength() || 0;
  path
    .attr("stroke-dasharray", `${pathLength} ${pathLength}`)
    .attr("stroke-dashoffset", pathLength)
    .transition()
    .duration(2000)
    .attr("stroke-dashoffset", 0);

  // Add tooltips
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

  const dots = svg.selectAll(".dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", d => x(new Date(d.timestamp)))
    .attr("cy", d => y(d.value))
    .attr("r", 4)
    .attr("fill", "steelblue")
    .style("opacity", 0)
    .on("mouseover", (event, d) => {
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(`Value: ${d.value}<br/>Time: ${new Date(d.timestamp).toLocaleString()}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });

  dots.transition()
    .delay((d, i) => i * 50)
    .style("opacity", 1);
};