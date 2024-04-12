// ---------- Insurance utils functions ----------

let insurance_conditions = (loss: number, deductible: number, limit: number) => {
  return Math.min(limit, Math.max(0, loss - deductible));
}

let rating_model = (nel:number, tvar:number) => {
  return nel + .08 * (tvar - nel)
}

// --------- Statistical functions ----------------

let quantile = (losses: number[], percentile: number) => {
  const sorted_losses = losses.sort((a, b) => a - b);
  const index = Math.floor(percentile * sorted_losses.length);
  return sorted_losses[index];
}

let mean = (losses: number[]) => {
  let sum = 0;
  for (let loss of losses) {
    sum += loss;
  }
  return sum / losses.length;
}

let tvar = (losses: number[], percentile: number) => {
  const quantile_loss = quantile(losses, percentile);
  let tvar_losses: number[] = [];

  for (let loss of losses) {
    if (loss >= quantile_loss) {
      tvar_losses.push(loss);
    }
  }
  return mean(tvar_losses);
}

// --------- Random number generators ---------

let rpareto1 = (shape: number, min: number) => {
  const u = Math.random();
  return min / Math.pow(1 - u, 1 / shape);
}

let rexp = (lambda: number) => {
  const u = Math.random();
  return -Math.log(1 - u) / lambda;
}

let rpoisson = (lambda: number) => {
  let rpois = -1;
  let t = 0;
  while(t < 1) {
    t += rexp(lambda);
    rpois++;
  }
  return rpois;
}

// --------- "Methods" on the loss_data "Object" ---------
// It would be better to use a class, but didn't have time to implement it
let update_annual_losses = (loss_data) => {
  loss_data.forEach(year_data => {
    year_data["annual_loss"] = year_data.losses.reduce((a, b) => a + b, 0);
  });
  return loss_data;
}

let calculate_annual_el = (loss_data) => {
  let losses = [];
  loss_data.forEach(year_data => {
    losses.push(year_data.annual_loss);
  });
  return mean(losses);
}

let get_annual_losses = (loss_data) => {
  let losses = [];
  loss_data.forEach(year_data => {
    losses.push(year_data.annual_loss);
  });
  return losses;
}

let calculate_frequency = (loss_data) => {
  let n_losses = [];
  loss_data.forEach(year_data => {
    n_losses.push(year_data.n_losses);
  });
  return mean(n_losses);
}

let simulate_nlosses = (n_years) => {
  let n_losses = [];
  for(let i = 0; i < n_years; i++) {
    const year_data = {
      year: i,
      n_losses: rpoisson(1)
    }
    year_data["losses"] = [...Array(year_data.n_losses)].map(() => 0);
    year_data["annual_loss"] = 0;
    n_losses.push(year_data)
  }
  return n_losses;
}

let simulate_severity = (loss_data) => {
  loss_data.forEach(year_data => {
    year_data["losses"] = [...Array(year_data.n_losses)].map(() => rpareto1(1.2, 2e6));
  });
  loss_data = update_annual_losses(loss_data);
  return loss_data;
}

let apply_event_conditions = (loss_data, deductible, limit) => {
  loss_data.forEach(year_data => {
    year_data["losses"] = year_data.losses.map(loss => insurance_conditions(loss, deductible, limit));
  });
  loss_data = update_annual_losses(loss_data);
  return loss_data;
}

let apply_aggregate_conditions  = (loss_data, aad, aal) => {
  loss_data.forEach(year_data => {
    let remaining_aad = aad;
    let remaining_aal = aal;
    let net_losses = [];
    year_data.losses.forEach(loss => {
      let net_xs_loss = Math.max(0, loss - remaining_aad);
      remaining_aad = Math.max(0, remaining_aad - loss);
      let net_loss = Math.min(remaining_aal, net_xs_loss);
      remaining_aal = Math.max(0, remaining_aal - net_loss);
      net_losses.push(net_loss);
    })
    year_data["losses"] = net_losses;
  });
  loss_data = update_annual_losses(loss_data);
  return loss_data;
}

// --------- String formatting functions ---------

let format_amount = (value) => {
  return Math.round(value).toLocaleString();
}

let format_percent = (value) => {
  return value.toLocaleString(undefined, {style: 'percent', minimumFractionDigits: 2});
}

// --------- Exercise functions ---------
//
let exercise_part1 = (n_years, name, deductible, limit, aad, aal) => {
  let loss_data = simulate_nlosses(n_years);
  loss_data = simulate_severity(loss_data);
  loss_data = apply_event_conditions(loss_data, deductible, limit);
  loss_data = apply_aggregate_conditions(loss_data, aad, aal);

  let nel = calculate_annual_el(loss_data)
  let var_99 = quantile(get_annual_losses(loss_data), .99)
  let tvar_99 = tvar(get_annual_losses(loss_data), .99)
  let premium = rating_model(nel, tvar_99)

  const results = {
    Structure: name,
    NEL: format_amount(nel),
    "VAR 99": format_amount(var_99),
    "TVAR 99": format_amount(tvar_99),
    Premium: format_amount(premium)
  }

  const table = document.getElementById("table1Body");
  let row = table.insertRow();

  console.log("********************");
  let col_idx = 0;
  Object.keys(results).forEach(key => {
    console.log(`${key}: ${results[key]}`);
    let cell = row.insertCell(col_idx++);
    cell.innerHTML = results[key];
  });
}

const simu_params = [
  {name: "10m xs 5m", deductible: 5e6, limit: 10e6, aad: 0, aal: Infinity},
  {name: "10m xs 5m, AAD 2m", deductible: 5e6, limit: 10e6, aad: 2e6, aal: Infinity},
  {name: "10m xs 5m, AAL 12m", deductible: 5e6, limit: 10e6, aad: 0, aal: 12e6},
  {name: "10m xs 5m, AAD 2m, AAL 12m", deductible: 5e6, limit: 10e6, aad: 2e6, aal: 12e6},
]

console.log("##### Exercise 1 #####")
simu_params.forEach(params => {
  exercise_part1(
    1e5,
    params.name,
    params.deductible,
    params.limit,
    params.aad,
    params.aal
  );
})

let apply_lag = (loss_data, lag_factor) => {
  loss_data.forEach(year_data => {
    year_data["losses"] = year_data.losses.map(loss => loss * lag_factor);
  });
  loss_data = update_annual_losses(loss_data);
  return loss_data;
}

let exercise_part2 = (n_years, pattern) => {
  let deductible = 5e6
  let limit = 10e6
  let aad = 2e6
  let aal = 12e6

  let lag_factor = .3;

  let loss_data = simulate_nlosses(n_years);
  loss_data = simulate_severity(loss_data);

  let results = []
  pattern.forEach(lag => {
    let lag_loss_data = structuredClone(loss_data);
    lag_loss_data = apply_lag(lag_loss_data, lag.factor);
    lag_loss_data = apply_event_conditions(lag_loss_data, deductible, limit);
    lag_loss_data = apply_aggregate_conditions(lag_loss_data, aad, aal);

    let nel = calculate_annual_el(lag_loss_data);
    results.push({year: lag.year, nel: nel});
  });

  let final_nel = results[results.length - 1].nel;
  let previous_lag_factor = 0;
  results.forEach(result => {
    let cum_lag_factor = result.nel / final_nel;
    result.cum_lag_factor = cum_lag_factor;
    result.inc_lag_factor = cum_lag_factor - previous_lag_factor;
    previous_lag_factor = cum_lag_factor;
  });

  console.log("********************");
  const table = document.getElementById("table2Body");
  results.forEach(result => {
    let year = result.year;
    let nel = format_amount(result.nel);
    let cum_lag_factor = format_percent(result.cum_lag_factor);
    let inc_lag_factor = format_percent(result.inc_lag_factor);

    console.log(`Year: ${year}`);
    console.log(`NEL: ${nel}`);
    console.log(`Cumulative Lag Factor: ${cum_lag_factor}`);
    console.log(`Incremental Lag Factor: ${inc_lag_factor}`);

    let row = table.insertRow();

    let cell = row.insertCell(0);
    cell.innerHTML = year;
    cell = row.insertCell(1);
    cell.innerHTML = nel;
    cell = row.insertCell(2);
    cell.innerHTML = cum_lag_factor;
    cell = row.insertCell(3);
    cell.innerHTML = inc_lag_factor;
  });

}

console.log("##### Exercise 2 #####");
let pattern = [
  {year: 1, factor: .3},
  {year: 2, factor: .9},
  {year: 3, factor: 1.}
]
exercise_part2(1e5, pattern);
