// ---------- Insurance utils functions ----------
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var insurance_conditions = function (loss, deductible, limit) {
    return Math.min(limit, Math.max(0, loss - deductible));
};
var rating_model = function (nel, tvar) {
    return nel + .08 * (tvar - nel);
};
// --------- Statistical functions ----------------
var quantile = function (losses, percentile) {
    var sorted_losses = losses.sort(function (a, b) { return a - b; });
    var index = Math.floor(percentile * sorted_losses.length);
    return sorted_losses[index];
};
var mean = function (losses) {
    var sum = 0;
    for (var _i = 0, losses_1 = losses; _i < losses_1.length; _i++) {
        var loss = losses_1[_i];
        sum += loss;
    }
    return sum / losses.length;
};
var tvar = function (losses, percentile) {
    var quantile_loss = quantile(losses, percentile);
    var tvar_losses = [];
    for (var _i = 0, losses_2 = losses; _i < losses_2.length; _i++) {
        var loss = losses_2[_i];
        if (loss >= quantile_loss) {
            tvar_losses.push(loss);
        }
    }
    return mean(tvar_losses);
};
// --------- Random number generators ---------
var rpareto1 = function (shape, min) {
    var u = Math.random();
    return min / Math.pow(1 - u, 1 / shape);
};
var rexp = function (lambda) {
    var u = Math.random();
    return -Math.log(1 - u) / lambda;
};
var rpoisson = function (lambda) {
    var rpois = -1;
    var t = 0;
    while (t < 1) {
        t += rexp(lambda);
        rpois++;
    }
    return rpois;
};
// --------- "Methods" on the loss_data "Object" ---------
// It would be better to use a class, but didn't have time to implement it
var update_annual_losses = function (loss_data) {
    loss_data.forEach(function (year_data) {
        year_data["annual_loss"] = year_data.losses.reduce(function (a, b) { return a + b; }, 0);
    });
    return loss_data;
};
var calculate_annual_el = function (loss_data) {
    var losses = [];
    loss_data.forEach(function (year_data) {
        losses.push(year_data.annual_loss);
    });
    return mean(losses);
};
var get_annual_losses = function (loss_data) {
    var losses = [];
    loss_data.forEach(function (year_data) {
        losses.push(year_data.annual_loss);
    });
    return losses;
};
var calculate_frequency = function (loss_data) {
    var n_losses = [];
    loss_data.forEach(function (year_data) {
        n_losses.push(year_data.n_losses);
    });
    return mean(n_losses);
};
var simulate_nlosses = function (n_years) {
    var n_losses = [];
    for (var i = 0; i < n_years; i++) {
        var year_data = {
            year: i,
            n_losses: rpoisson(1)
        };
        year_data["losses"] = __spreadArray([], Array(year_data.n_losses), true).map(function () { return 0; });
        year_data["annual_loss"] = 0;
        n_losses.push(year_data);
    }
    return n_losses;
};
var simulate_severity = function (loss_data) {
    loss_data.forEach(function (year_data) {
        year_data["losses"] = __spreadArray([], Array(year_data.n_losses), true).map(function () { return rpareto1(1.2, 2e6); });
    });
    loss_data = update_annual_losses(loss_data);
    return loss_data;
};
var apply_event_conditions = function (loss_data, deductible, limit) {
    loss_data.forEach(function (year_data) {
        year_data["losses"] = year_data.losses.map(function (loss) { return insurance_conditions(loss, deductible, limit); });
    });
    loss_data = update_annual_losses(loss_data);
    return loss_data;
};
var apply_aggregate_conditions = function (loss_data, aad, aal) {
    loss_data.forEach(function (year_data) {
        var remaining_aad = aad;
        var remaining_aal = aal;
        var net_losses = [];
        year_data.losses.forEach(function (loss) {
            var net_xs_loss = Math.max(0, loss - remaining_aad);
            remaining_aad = Math.max(0, remaining_aad - loss);
            var net_loss = Math.min(remaining_aal, net_xs_loss);
            remaining_aal = Math.max(0, remaining_aal - net_loss);
            net_losses.push(net_loss);
        });
        year_data["losses"] = net_losses;
    });
    loss_data = update_annual_losses(loss_data);
    return loss_data;
};
// --------- String formatting functions ---------
var format_amount = function (value) {
    return Math.round(value).toLocaleString();
};
var format_percent = function (value) {
    return value.toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 2 });
};
// --------- Exercise functions ---------
//
var exercise_part1 = function (n_years, name, deductible, limit, aad, aal) {
    var loss_data = simulate_nlosses(n_years);
    loss_data = simulate_severity(loss_data);
    loss_data = apply_event_conditions(loss_data, deductible, limit);
    loss_data = apply_aggregate_conditions(loss_data, aad, aal);
    var nel = calculate_annual_el(loss_data);
    var var_99 = quantile(get_annual_losses(loss_data), .99);
    var tvar_99 = tvar(get_annual_losses(loss_data), .99);
    var premium = rating_model(nel, tvar_99);
    var results = {
        Structure: name,
        NEL: format_amount(nel),
        "VAR 99": format_amount(var_99),
        "TVAR 99": format_amount(tvar_99),
        Premium: format_amount(premium)
    };
    var table = document.getElementById("table1Body");
    var row = table.insertRow();
    console.log("********************");
    var col_idx = 0;
    Object.keys(results).forEach(function (key) {
        console.log("".concat(key, ": ").concat(results[key]));
        var cell = row.insertCell(col_idx++);
        cell.innerHTML = results[key];
    });
};
var simu_params = [
    { name: "10m xs 5m", deductible: 5e6, limit: 10e6, aad: 0, aal: Infinity },
    { name: "10m xs 5m, AAD 2m", deductible: 5e6, limit: 10e6, aad: 2e6, aal: Infinity },
    { name: "10m xs 5m, AAL 12m", deductible: 5e6, limit: 10e6, aad: 0, aal: 12e6 },
    { name: "10m xs 5m, AAD 2m, AAL 12m", deductible: 5e6, limit: 10e6, aad: 2e6, aal: 12e6 },
];
console.log("##### Exercise 1 #####");
simu_params.forEach(function (params) {
    exercise_part1(1e5, params.name, params.deductible, params.limit, params.aad, params.aal);
});
var apply_lag = function (loss_data, lag_factor) {
    loss_data.forEach(function (year_data) {
        year_data["losses"] = year_data.losses.map(function (loss) { return loss * lag_factor; });
    });
    loss_data = update_annual_losses(loss_data);
    return loss_data;
};
var exercise_part2 = function (n_years, pattern) {
    var deductible = 5e6;
    var limit = 10e6;
    var aad = 2e6;
    var aal = 12e6;
    var lag_factor = .3;
    var loss_data = simulate_nlosses(n_years);
    loss_data = simulate_severity(loss_data);
    var results = [];
    pattern.forEach(function (lag) {
        var lag_loss_data = structuredClone(loss_data);
        lag_loss_data = apply_lag(lag_loss_data, lag.factor);
        lag_loss_data = apply_event_conditions(lag_loss_data, deductible, limit);
        lag_loss_data = apply_aggregate_conditions(lag_loss_data, aad, aal);
        var nel = calculate_annual_el(lag_loss_data);
        results.push({ year: lag.year, nel: nel });
    });
    var final_nel = results[results.length - 1].nel;
    var previous_lag_factor = 0;
    results.forEach(function (result) {
        var cum_lag_factor = result.nel / final_nel;
        result.cum_lag_factor = cum_lag_factor;
        result.inc_lag_factor = cum_lag_factor - previous_lag_factor;
        previous_lag_factor = cum_lag_factor;
    });
    console.log("********************");
    var table = document.getElementById("table2Body");
    results.forEach(function (result) {
        var year = result.year;
        var nel = format_amount(result.nel);
        var cum_lag_factor = format_percent(result.cum_lag_factor);
        var inc_lag_factor = format_percent(result.inc_lag_factor);
        console.log("Year: ".concat(year));
        console.log("NEL: ".concat(nel));
        console.log("Cumulative Lag Factor: ".concat(cum_lag_factor));
        console.log("Incremental Lag Factor: ".concat(inc_lag_factor));
        var row = table.insertRow();
        var cell = row.insertCell(0);
        cell.innerHTML = year;
        cell = row.insertCell(1);
        cell.innerHTML = nel;
        cell = row.insertCell(2);
        cell.innerHTML = cum_lag_factor;
        cell = row.insertCell(3);
        cell.innerHTML = inc_lag_factor;
    });
};
console.log("##### Exercise 2 #####");
var pattern = [
    { year: 1, factor: .3 },
    { year: 2, factor: .9 },
    { year: 3, factor: 1. }
];
exercise_part2(1e5, pattern);
