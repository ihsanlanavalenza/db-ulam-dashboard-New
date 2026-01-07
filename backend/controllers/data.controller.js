// backend/controllers/data.controller.js
const db = require('../config/db');
const { buildWhereClause, buildBranchWhereClause, getUserLevelFilters } = require('../utils/filterHelper');

// ===========================
// Endpoint: Get Peta Marker
// ===========================
const getBranchLocations = async (req, res) => {
  const { whereClause, params } = buildBranchWhereClause(req);

  const query = `
    SELECT 
      COALESCE(Latitude, '0') AS LATITUDE, 
      COALESCE(Longitude, '0') AS LONGITUDE, 
      Nama_Unit AS NAMA_UNIT
    FROM master_data_branch_new 
    ${whereClause || 'WHERE 1=1'}
    AND Latitude IS NOT NULL 
    AND Longitude IS NOT NULL
    AND Latitude != '' 
    AND Longitude != ''
  `;
  
  try {
    const [rows] = await db.promise().query(query, params);

    const cleaned = rows.map((loc) => ({
      ...loc,
      LATITUDE: parseFloat(loc.LATITUDE.replace(',', '.')),
      LONGITUDE: parseFloat(loc.LONGITUDE.replace(',', '.')),
    })).filter(loc => !isNaN(loc.LATITUDE) && !isNaN(loc.LONGITUDE));

    res.json(cleaned);
  } catch (err) {
    console.error("Error fetching locations:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ===========================
// Endpoint: Get Filter Dropdown
// ===========================
const getFilters = async (req, res) => {
  try {
    const { cabangFilter, unitFilter, params } = getUserLevelFilters(req);
    const response = { cabang: [], unit: [] };

    // Get cabang list based on user level
    const cabangQuery = `SELECT DISTINCT Nama_Cabang FROM master_data_branch_new ${cabangFilter} ORDER BY Nama_Cabang`;
    const [cabangResults] = await db.promise().query(cabangQuery, params.slice(0, 1));
    response.cabang = cabangResults.map(row => row.Nama_Cabang);

    // Get unit list based on user level
    const unitQuery = `SELECT DISTINCT Nama_Unit FROM master_data_branch_new ${unitFilter} ORDER BY Nama_Unit`;
    const [unitResults] = await db.promise().query(unitQuery, params.slice(params.length === 2 ? 1 : 0));
    response.unit = unitResults.map(row => row.Nama_Unit);

    res.json(response);
  } catch (err) {
    console.error('Error in getFilters:', err);
    res.status(500).json({ error: err.message });
  }
};

// ===========================
// Endpoint: Get Summary Card
// ===========================
const getSummary = (req, res) => {
  const { whereClause: whereCondition, params: baseParams } = buildWhereClause(req);

  const query = `
  SELECT 
    -- Konsolidasi
    (SELECT SUM(NOA) FROM Summary_Realtime_ULaMM ${whereCondition}) AS noa_konsolidasi,
    (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(REPLACE(IFNULL(OS,'0'), 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))), 0) FROM Summary_Realtime_ULaMM ${whereCondition}) AS os_konsolidasi,

    -- ULaMM
    (SELECT SUM(NOA) FROM Summary_Realtime_ULaMM ${whereCondition}) AS noa_ulamm,
    (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(REPLACE(IFNULL(OS,'0'), 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))), 0) FROM Summary_Realtime_ULaMM ${whereCondition}) AS os_ulamm,

    -- KM200
    (SELECT SUM(NOA) FROM Summary_Realtime_KM200 ${whereCondition}) AS noa_km200,
    (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(REPLACE(IFNULL(OS,'0'), 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))), 0) FROM Summary_Realtime_KM200 ${whereCondition}) AS os_km200,

    -- Penyaluran bulan & tahun ini
    (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(REPLACE(IFNULL(NetLending,'0'), 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))), 0) FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS net_lending_bulan_ini,
    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(NoaLending, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS noa_lending_bulan_ini,
    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(NetLending, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS net_lending_tahun_ini,
    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(NoaLending, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS noa_lending_tahun_ini,

    -- PAR, NPL, LAR
    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(OSPar, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS os_par,
    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(OSNPL, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS os_npl,
    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(OS_LAR, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS os_lar,
    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(NoaPar, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS noa_par,
    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(NoaNPL, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS noa_npl,
    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(Noa_LAR, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS noa_lar,

    -- SDM
    (SELECT SUM(AOM) FROM SummaryDailyWithoutSyariah ${whereCondition}) AS aom,
    (SELECT SUM(AOMPantas) FROM SummaryDailyWithoutSyariah ${whereCondition}) AS aom_pantas,
    (SELECT SUM(KAM) FROM SummaryDailyWithoutSyariah ${whereCondition}) AS kam,
    (SELECT SUM(KUU) FROM SummaryDailyWithoutSyariah ${whereCondition}) AS kuu,
    (SELECT COUNT(*) FROM SummaryDailyWithoutSyariah ${whereCondition}) AS total_pendamping,

    -- Unit & Hari Kerja
    (SELECT COUNT(DISTINCT KodeUnit) FROM Summary_Realtime_ULaMM ${whereCondition}) AS total_unit,
    (SELECT COUNT(*) FROM calender WHERE \`Index\` = 'Hari Kerja') AS sisa_hari_kerja,

    -- KPI OS per NOA
    (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(REPLACE(IFNULL(OS,'0'), 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))), 0) FROM Summary_Realtime_ULaMM ${whereCondition}) AS avg_os_per_nasabah,
    (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(REPLACE(IFNULL(OSPar,'0'), 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))), 0) FROM Summary_Realtime_ULaMM ${whereCondition}) AS ospar_per_noapar,
    (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(REPLACE(IFNULL(OS_LAR,'0'), 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))), 0) FROM Summary_Realtime_ULaMM ${whereCondition}) AS oslar_per_noalar,
    (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(REPLACE(IFNULL(OSNPL,'0'), 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))), 0) FROM Summary_Realtime_ULaMM ${whereCondition}) AS osnpl_per_noanpl,

    -- KPI NOA & OS
    (SELECT SUM(NOA) FROM Summary_Realtime_ULaMM ${whereCondition}) AS kpi_noa,
    (SELECT SUM(NOA_3R_Covid) FROM Summary_Realtime_ULaMM ${whereCondition}) AS kpi_noa_per_aom,
    (SELECT SUM(NOA_3R_NonCovid) FROM Summary_Realtime_ULaMM ${whereCondition}) AS kpi_noa_per_unit,
    (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(REPLACE(IFNULL(OS,'0'), 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))), 0) FROM Summary_Realtime_ULaMM ${whereCondition}) AS kpi_os,
    (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(REPLACE(IFNULL(OS_3R_Covid,'0'), 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))), 0) FROM Summary_Realtime_ULaMM ${whereCondition}) AS kpi_os_per_aom,
    (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(REPLACE(IFNULL(OS_3R_NonCovid,'0'), 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))), 0) FROM Summary_Realtime_ULaMM ${whereCondition}) AS kpi_os_per_unit,

    -- CARD portofolio
    (SELECT SUM(NOA) FROM Summary_Realtime_ULaMM ${whereCondition}) AS card_noa,
    (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(REPLACE(IFNULL(OS,'0'), 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))), 0) FROM Summary_Realtime_ULaMM ${whereCondition}) AS card_os,
    (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(REPLACE(IFNULL(NoaLending,'0'), 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))), 0) FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS card_noa_bulan_ini,
    (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(REPLACE(IFNULL(NetLending,'0'), 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))), 0) FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS card_plafond_bulan_ini,
    (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(REPLACE(IFNULL(NoaLending,'0'), 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))), 0) FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS card_noa_tahun_ini,
    (SELECT COALESCE(SUM(CAST(REPLACE(REPLACE(REPLACE(IFNULL(NetLending,'0'), 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))), 0) FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS card_plafond_tahun_ini,

    -- CARD TREN QUALITY
    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(OSPar, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) 
     FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS card_os_par,

    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(NoaPar, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) 
     FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS card_noa_par,

    (SELECT 
        (SUM(CAST(REPLACE(REPLACE(REPLACE(OSPar, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) /
         NULLIF(SUM(CAST(REPLACE(REPLACE(REPLACE(OS, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))),0)
        ) * 100
     FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS card_pct_par,


    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(OS_LAR, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) 
     FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS card_os_lar,

    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(Noa_LAR, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) 
     FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS card_noa_lar,

    (SELECT 
        (SUM(CAST(REPLACE(REPLACE(REPLACE(OS_LAR, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) /
         NULLIF(SUM(CAST(REPLACE(REPLACE(REPLACE(OS, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))),0)
        ) * 100
     FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS card_pct_lar,


    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(OSNPL, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) 
     FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS card_os_npl,

    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(NoaNPL, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) 
     FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS card_noa_npl,

    (SELECT 
        (SUM(CAST(REPLACE(REPLACE(REPLACE(OSNPL, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) /
         NULLIF(SUM(CAST(REPLACE(REPLACE(REPLACE(OS, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))),0)
        ) * 100
     FROM \`For Grafik Live ULaMM\` ${whereCondition}) AS card_pct_npl,

    -- CARD Plafond KM200
    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(Noa_Plafond_Dibawah_50jt, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) 
     FROM \`For Grafil Live KM200\` ${whereCondition}) AS card_noa_plafond_50jt,
    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(OS_Plafond_Dibawah_50jt, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) 
     FROM \`For Grafil Live KM200\` ${whereCondition}) AS card_os_plafond_50jt,

    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(Noa_Plafond_51_Hingga_100jt, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) 
     FROM \`For Grafil Live KM200\` ${whereCondition}) AS card_noa_plafond_51_100jt,
    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(OS_Plafond_51_Hingga_100jt, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) 
     FROM \`For Grafil Live KM200\` ${whereCondition}) AS card_os_plafond_51_100jt,

    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(Noa_Plafond_101_Hingga_200jt, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) 
     FROM \`For Grafil Live KM200\` ${whereCondition}) AS card_noa_plafond_101_200jt,
    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(OS_Plafond_101_Hingga_200jt, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) 
     FROM \`For Grafil Live KM200\` ${whereCondition}) AS card_os_plafond_101_200jt,

    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(Noa_Plafond_201_Hingga_400jt, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) 
     FROM \`For Grafil Live KM200\` ${whereCondition}) AS card_noa_plafond_201_400jt,
    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(OS_Plafond_201_Hingga_400jt, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) 
     FROM \`For Grafil Live KM200\` ${whereCondition}) AS card_os_plafond_201_400jt,

    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(Noa_Plafond_Lebih_Dari_400jt, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) 
     FROM \`For Grafil Live KM200\` ${whereCondition}) AS card_noa_plafond_lebih_400jt,
    (SELECT SUM(CAST(REPLACE(REPLACE(REPLACE(OS_Plafond_Lebih_Dari_400jt, 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) 
     FROM \`For Grafil Live KM200\` ${whereCondition}) AS card_os_plafond_lebih_400jt
  `;

  // isi params sesuai jumlah tanda tanya
  const params = [];
  const totalPlaceholders = (query.match(/\?/g) || []).length;

  if (baseParams.length > 0 && totalPlaceholders > 0) {
    // Calculate how many times we need to repeat the params
    const repeatCount = Math.ceil(totalPlaceholders / baseParams.length);
    for (let i = 0; i < repeatCount; i++) {
      params.push(...baseParams);
    }
    // Trim to exact length needed
    params.length = totalPlaceholders;
  }

  // Debug logs removed for production

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("❌ Error executing summary query:", err);
      return res.status(500).json({ error: err.message });
    }
     res.json(results[0]);
  });
};

// ===========================
// Endpoint: Get Grafik Productivity (MySQL)
// ===========================
const getGrafikProductivity = (req, res) => {
  // Apply user-level filtering
  const userFilter = req.dataFilter || {};
  let { cabang = 'All', unit = 'All' } = req.query;
  
  // Override query params with user-level restrictions
  if (userFilter.unit_id) {
    unit = userFilter.unit_id;
    cabang = userFilter.cabang_id || cabang;
  } else if (userFilter.cabang_id) {
    cabang = userFilter.cabang_id;
  }
  
  const params = [cabang, cabang, unit, unit];

  const queryAOM = `
    SELECT 
      DATE_FORMAT(c.eom_date, '%b %y') AS bulan_label,
      DATE_FORMAT(c.eom_date, '%Y-%m-01') AS bulan_date,
      COALESCE(SUM(s.NOA), 0) AS NoA_AOM,
      COALESCE(SUM(s.OS), 0) AS OS_AOM
    FROM (
      SELECT EOM,
             STR_TO_DATE(CONCAT('01 ', EOM), '%d %b %y') AS eom_date
      FROM calender
    ) c
    LEFT JOIN summarymonthly s
      ON YEAR(c.eom_date) = YEAR(
           COALESCE(
             STR_TO_DATE(s.Periode, '%d/%m/%Y %H:%i:%s'),
             STR_TO_DATE(s.Periode, '%d/%m/%Y'),
             STR_TO_DATE(s.Periode, '%Y-%m-%d %H:%i:%s'),
             DATE(s.Periode)
           )
         )
      AND MONTH(c.eom_date) = MONTH(
           COALESCE(
             STR_TO_DATE(s.Periode, '%d/%m/%Y %H:%i:%s'),
             STR_TO_DATE(s.Periode, '%d/%m/%Y'),
             STR_TO_DATE(s.Periode, '%Y-%m-%d %H:%i:%s'),
             DATE(s.Periode)
           )
         )
      AND (? = 'All' OR s.cabang = ?)
      AND (? = 'All' OR s.namaunit = ?)
    WHERE c.eom_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY c.eom_date
    ORDER BY c.eom_date;
  `;

  const queryUnit = `
    SELECT 
      DATE_FORMAT(c.eom_date, '%b %y') AS bulan_label,
      DATE_FORMAT(c.eom_date, '%Y-%m-01') AS bulan_date,
      COALESCE(SUM(s.NOA), 0) AS NoA_Unit,
      COALESCE(SUM(s.OS), 0) AS OS_Unit
    FROM (
      SELECT EOM,
            STR_TO_DATE(CONCAT('01 ', EOM), '%d %b %y') AS eom_date
      FROM calender
    ) c
    LEFT JOIN \`For Grafik Live ULaMM\` s   -- ✅ ganti \ menjadi backtick
      ON YEAR(c.eom_date) = YEAR(
          COALESCE(
            STR_TO_DATE(s.tgl_tarik, '%d/%m/%Y %H:%i:%s'),
            STR_TO_DATE(s.tgl_tarik, '%d/%m/%Y'),
            STR_TO_DATE(s.tgl_tarik, '%Y-%m-%d %H:%i:%s'),
            DATE(s.tgl_tarik)
          )
        )
      AND MONTH(c.eom_date) = MONTH(
          COALESCE(
            STR_TO_DATE(s.tgl_tarik, '%d/%m/%Y %H:%i:%s'),
            STR_TO_DATE(s.tgl_tarik, '%d/%m/%Y'),
            STR_TO_DATE(s.tgl_tarik, '%Y-%m-%d %H:%i:%s'),
            DATE(s.tgl_tarik)
          )
        )
      AND (? = 'All' OR s.cabang = ?)
      AND (? = 'All' OR s.namaunit = ?)
    WHERE c.eom_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY c.eom_date
    ORDER BY c.eom_date;
  `;

  db.query(queryAOM, params, (err, resultAOM) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(queryUnit, params, (err2, resultUnit) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const fixNumbers = rows =>
        (rows || []).map(r => {
          const out = {};
          Object.keys(r).forEach(k => {
            if (typeof r[k] === 'string' && r[k].match(/^\d+(\.\d+)?$/)) {
              out[k] = Number(r[k]);
            } else {
              out[k] = r[k];
            }
          });
          return out;
        });

      res.json({
        aom: fixNumbers(resultAOM),
        unit: fixNumbers(resultUnit)
      });
    });
  });
};
// ===========================
// Endpoint: Get Grafik Tren Portofolio
// ===========================
const util = require("util");

const getGrafikTrenPortofolio = async (req, res) => {
  try {
    // Apply user-level filtering
    const userFilter = req.dataFilter || {};
    let { cabang = "All", unit = "All" } = req.query;
    
    // Override query params with user-level restrictions
    if (userFilter.unit_id) {
      unit = userFilter.unit_id;
      cabang = userFilter.cabang_id || cabang;
    } else if (userFilter.cabang_id) {
      cabang = userFilter.cabang_id;
    }
    
    const queryAsync = util.promisify(db.query).bind(db);

    // Fungsi bantu untuk buat kondisi WHERE dan params dinamis
    function buildWhereClause(tableAlias = "s") {
      const whereClauses = [];
      const params = [];

      if (cabang !== "All") {
        whereClauses.push(`${tableAlias}.Cabang = ?`);
        params.push(cabang);
      }
      if (unit !== "All") {
        whereClauses.push(`${tableAlias}.NamaUnit = ?`);
        params.push(unit);
      }

      whereClauses.push(`
        COALESCE(
          STR_TO_DATE(${tableAlias}.tgl_tarik, '%d/%m/%Y %H:%i:%s'),
          STR_TO_DATE(${tableAlias}.tgl_tarik, '%d/%m/%Y'),
          STR_TO_DATE(${tableAlias}.tgl_tarik, '%Y-%m-%d %H:%i:%s'),
          DATE(${tableAlias}.tgl_tarik)
        ) >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      `);

      return { whereSQL: whereClauses.length ? "WHERE " + whereClauses.join(" AND ") : "", params };
    }

    // Untuk Summary_Realtime_ULaMM tabel
    function buildWhereClauseRealtime() {
      const whereClauses = [];
      const params = [];

      if (cabang !== "All") {
        whereClauses.push(`s.Cabang = ?`);
        params.push(cabang);
      }
      if (unit !== "All") {
        whereClauses.push(`s.NamaUnit = ?`);
        params.push(unit);
      }

      whereClauses.push(`
        COALESCE(
          STR_TO_DATE(s.tgl_tarik, '%d/%m/%Y %H:%i:%s'),
          STR_TO_DATE(s.tgl_tarik, '%d/%m/%Y'),
          STR_TO_DATE(s.tgl_tarik, '%Y-%m-%d %H:%i:%s'),
          DATE(s.tgl_tarik)
        ) >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      `);

      return { whereSQL: whereClauses.length ? "WHERE " + whereClauses.join(" AND ") : "", params };
    }

    // Buat SQL dan params untuk Summary_Realtime_ULaMM
    const { whereSQL: whereSummary, params: paramsSummary } = buildWhereClause("s");
    const sqlTrenPortofolio_Summary = `
      SELECT 
          DATE_FORMAT(
            COALESCE(
              STR_TO_DATE(s.tgl_tarik, '%d/%m/%Y %H:%i:%s'),
              STR_TO_DATE(s.tgl_tarik, '%d/%m/%Y'),
              STR_TO_DATE(s.tgl_tarik, '%Y-%m-%d %H:%i:%s'),
              DATE(s.tgl_tarik)
            ),
            '%b %y'
          ) AS bulan_label,
          DATE_FORMAT(
            COALESCE(
              STR_TO_DATE(s.tgl_tarik, '%d/%m/%Y %H:%i:%s'),
              STR_TO_DATE(s.tgl_tarik, '%d/%m/%Y'),
              STR_TO_DATE(s.tgl_tarik, '%Y-%m-%d %H:%i:%s'),
              DATE(s.tgl_tarik)
            ),
            '%Y-%m-01'
          ) AS bulan_date,
          SUM(s.NOA) AS NoA,
          SUM(CAST(REPLACE(REPLACE(REPLACE(IFNULL(s.OS, '0'), 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) AS OS
      FROM Summary_Realtime_ULaMM s
      ${whereSummary}
      GROUP BY bulan_label, bulan_date
      ORDER BY bulan_date
      LIMIT 12;
    `;

    // Buat SQL dan params untuk Grafik Live tapi dari Summary_Realtime_ULaMM
    const { whereSQL: whereRealtime, params: paramsRealtime } = buildWhereClauseRealtime();
    const sqlTrenPortofolio_FGL = `
      SELECT 
          DATE_FORMAT(
            COALESCE(
              STR_TO_DATE(s.tgl_tarik, '%d/%m/%Y %H:%i:%s'),
              STR_TO_DATE(s.tgl_tarik, '%d/%m/%Y'),
              STR_TO_DATE(s.tgl_tarik, '%Y-%m-%d %H:%i:%s'),
              DATE(s.tgl_tarik)
            ),
            '%b %y'
          ) AS bulan_label,
          DATE_FORMAT(
            COALESCE(
              STR_TO_DATE(s.tgl_tarik, '%d/%m/%Y %H:%i:%s'),
              STR_TO_DATE(s.tgl_tarik, '%d/%m/%Y'),
              STR_TO_DATE(s.tgl_tarik, '%Y-%m-%d %H:%i:%s'),
              DATE(s.tgl_tarik)
            ),
            '%Y-%m-01'
          ) AS bulan_date,
          SUM(CAST(REPLACE(REPLACE(REPLACE(IFNULL(s.NoaLending, '0'), 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) AS NoaLending,
          SUM(CAST(REPLACE(REPLACE(REPLACE(IFNULL(s.NetLending, '0'), 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) AS NetLending
      FROM \`For Grafik Live ULaMM\` s
      ${whereRealtime}
      GROUP BY bulan_label, bulan_date
      ORDER BY bulan_date
      LIMIT 12;
    `;

    // Buat SQL dan params untuk Top5 NoA
    const { whereSQL: whereTop5, params: paramsTop5 } = buildWhereClauseRealtime();
    const sqlTop5NoA = `
      SELECT s.Cabang, SUM(s.NOA) AS total_noa
      FROM Summary_Realtime_ULaMM s
      ${whereTop5}
      GROUP BY s.Cabang
      ORDER BY total_noa DESC
      LIMIT 5;
    `;

    // Buat SQL dan params untuk Top5 OS
    const sqlTop5OS = `
      SELECT s.Cabang, SUM(CAST(REPLACE(REPLACE(REPLACE(IFNULL(s.OS, '0'), 'Rp', ''), '.', ''), ',', '.') AS DECIMAL(20,2))) AS total_os
      FROM Summary_Realtime_ULaMM s
      ${whereTop5}
      GROUP BY s.Cabang
      ORDER BY total_os DESC
      LIMIT 5;
    `;

    // Jalankan query paralel dengan params yang sesuai
    const [
      TrenPortofolio_Summary,
      TrenPortofolio_FGL,
      dataTop5NoA,
      dataTop5OS
    ] = await Promise.all([
      queryAsync(sqlTrenPortofolio_Summary, paramsSummary),
      queryAsync(sqlTrenPortofolio_FGL, paramsRealtime),
      queryAsync(sqlTop5NoA, paramsTop5),
      queryAsync(sqlTop5OS, paramsTop5),
    ]);

    res.json({
      trenPortofolio_Summary: TrenPortofolio_Summary,
      trenPortofolio_FGL: TrenPortofolio_FGL,
      top5Noa: dataTop5NoA,
      top5OS: dataTop5OS
    });

  } catch (err) {
    console.error("Error getGrafikTrenPortofolio:", err);
    res.status(500).json({ error: err.message });
  }
};

// ===========================
// Endpoint: Get Grafik Portofolio
// ===========================

const getGrafikPortofolio = (req, res) => {
  // Apply user-level filtering
  const userFilter = req.dataFilter || {};
  let { cabang = 'All', unit = 'All' } = req.query;
  
  // Override query params with user-level restrictions
  if (userFilter.unit_id) {
    unit = userFilter.unit_id;
    cabang = userFilter.cabang_id || cabang;
  } else if (userFilter.cabang_id) {
    cabang = userFilter.cabang_id;
  }
  
  const paramsNoaOs = [cabang, cabang, unit, unit];
  const paramsPenyaluran = [cabang, cabang, unit, unit];

  // ✅ Tren NoA & OS → Ganti tabel menjadi For Grafik Live ULaMM
  const queryNoaOs = `
    SELECT 
      DATE_FORMAT(c.eom_date, '%b %y') AS bulan_label,
      DATE_FORMAT(c.eom_date, '%Y-%m-01') AS bulan_date,
      COALESCE(SUM(s.NOA), 0) AS NOA,
      COALESCE(SUM(s.OS), 0) AS OS
    FROM (
      SELECT EOM,
            STR_TO_DATE(CONCAT('01 ', EOM), '%d %b %y') AS eom_date
      FROM calender
    ) c
    LEFT JOIN \`For Grafik Live ULaMM\` s
      ON YEAR(c.eom_date) = YEAR(STR_TO_DATE(s.tgl_tarik, '%d/%m/%Y %H:%i:%s'))
        AND MONTH(c.eom_date) = MONTH(STR_TO_DATE(s.tgl_tarik, '%d/%m/%Y %H:%i:%s'))
      AND (? = 'All' OR s.cabang = ?)
      AND (? = 'All' OR s.NamaUnit = ?)
    WHERE c.eom_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY c.eom_date
    ORDER BY c.eom_date;
  `;

  // ✅ Tren Penyaluran
  const queryPenyaluran = `
    SELECT 
      DATE_FORMAT(c.eom_date, '%b %y') AS bulan_label,
      DATE_FORMAT(c.eom_date, '%Y-%m-01') AS bulan_date,
      COALESCE(SUM(s.NetLending), 0) AS netLending
    FROM (
      SELECT EOM,
            STR_TO_DATE(CONCAT('01 ', EOM), '%d %b %y') AS eom_date
      FROM calender
    ) c
    LEFT JOIN summarymonthly s
      ON YEAR(c.eom_date) = YEAR(STR_TO_DATE(s.tgl_tarik, '%d/%m/%Y %H:%i:%s'))
      AND MONTH(c.eom_date) = MONTH(STR_TO_DATE(s.tgl_tarik, '%d/%m/%Y %H:%i:%s'))
      AND (? = 'All' OR s.Cabang = ?)
      AND (? = 'All' OR s.NamaUnit = ?)
    WHERE c.eom_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY c.eom_date
    ORDER BY c.eom_date;
  `;

  db.query(queryNoaOs, paramsNoaOs, (err, resultNoaOs) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(queryPenyaluran, paramsPenyaluran, (err2, resultPenyaluran) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const fixNumbers = rows =>
        (rows || []).map(r => {
          const out = {};
          Object.keys(r).forEach(k => {
            if (typeof r[k] === 'string' && r[k].match(/^\d+(\.\d+)?$/)) {
              out[k] = Number(r[k]);
            } else {
              out[k] = r[k];
            }
          });
          return out;
        });

      res.json({
        trenNoaOs: fixNumbers(resultNoaOs),
        trenPenyaluran: fixNumbers(resultPenyaluran)
      });
    });
  });
};

// ===========================
// Endpoint: Get Grafik Tren Quality (PAR, LAR, NPL)
// ===========================
const getGrafikTrenQuality = async (req, res) => {
  // Apply user-level filtering
  const userFilter = req.dataFilter || {};
  let { cabang = "All", unit = "All" } = req.query;
  
  // Override query params with user-level restrictions
  if (userFilter.unit_id) {
    unit = userFilter.unit_id;
    cabang = userFilter.cabang_id || cabang;
  } else if (userFilter.cabang_id) {
    cabang = userFilter.cabang_id;
  }

  // Params untuk semua query (urutan harus konsisten dengan query)
  const params = [cabang, cabang, unit, unit];

  // 🔹 1) Query tren (ditambahkan periode_date ISO)
  const queryTrend = `
    WITH cal AS (
      SELECT EOM, STR_TO_DATE(CONCAT('01 ', EOM), '%d %b %y') AS eom_date
      FROM calender
    ),
    src AS (
      SELECT
        YEAR(STR_TO_DATE(f.tgl_tarik, '%d/%m/%Y %H:%i:%s')) AS y,
        MONTH(STR_TO_DATE(f.tgl_tarik, '%d/%m/%Y %H:%i:%s')) AS m,
        f.cabang,
        f.NamaUnit,
        f.OSPar,
        f.OS_LAR,
        f.OSNPL
      FROM \`For Grafik Live ULaMM\` f
    )
    SELECT
      DATE_FORMAT(c.eom_date, '%b %y') AS periode,
      DATE_FORMAT(c.eom_date, '%Y-%m-%d') AS periode_date,
      COALESCE(SUM(s.OSPAR), 0) AS OSPAR,
      COALESCE(SUM(s.OS_LAR), 0) AS OSLAR,
      COALESCE(SUM(s.OSNPL), 0) AS OSNPL
    FROM cal c
    LEFT JOIN src s
      ON YEAR(c.eom_date) = s.y
      AND MONTH(c.eom_date) = s.m
      AND (? = 'All' OR LOWER(s.cabang) = LOWER(?))
      AND (? = 'All' OR LOWER(s.NamaUnit) = LOWER(?))
    WHERE c.eom_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    GROUP BY c.eom_date
    ORDER BY c.eom_date;
  `;

  // 🔹 2a) Top 5 PAR (langsung dari tabel utama)
  const queryTop5PAR = `
    SELECT 
      f.cabang AS ID_Cabang,
      f.cabang AS Nama_Cabang,
      SUM(f.OSPar) AS OSPAR
    FROM \`For Grafik Live ULaMM\` f
    WHERE (? = 'All' OR LOWER(f.cabang) = LOWER(?))
      AND (? = 'All' OR LOWER(f.NamaUnit) = LOWER(?))
    GROUP BY f.cabang
    ORDER BY OSPAR DESC
    LIMIT 5;
  `;

  // 🔹 2b) Top 5 LAR
  const queryTop5LAR = `
    SELECT 
      f.cabang AS ID_Cabang,
      f.cabang AS Nama_Cabang,
      SUM(f.OS_LAR) AS OSLAR
    FROM \`For Grafik Live ULaMM\` f
    WHERE (? = 'All' OR LOWER(f.cabang) = LOWER(?))
      AND (? = 'All' OR LOWER(f.NamaUnit) = LOWER(?))
    GROUP BY f.cabang
    ORDER BY OSLAR DESC
    LIMIT 5;
  `;

  // 🔹 2c) Top 5 NPL
  const queryTop5NPL = `
    SELECT 
      f.cabang AS ID_Cabang,
      f.cabang AS Nama_Cabang,
      SUM(f.OSNPL) AS OSNPL
    FROM \`For Grafik Live ULaMM\` f
    WHERE (? = 'All' OR LOWER(f.cabang) = LOWER(?))
      AND (? = 'All' OR LOWER(f.NamaUnit) = LOWER(?))
    GROUP BY f.cabang
    ORDER BY OSNPL DESC
    LIMIT 5;
  `;

  // ✅ Convert angka string → number
  const fixNumbers = (rows) =>
    (rows || []).map((r) => {
      const out = {};
      Object.keys(r).forEach((k) => {
        const val = r[k];
        out[k] = val !== null && !isNaN(val) ? Number(val) : val;
      });
      return out;
    });

  try {
    const util = require("util");
    const queryAsync = util.promisify(db.query).bind(db);

    const [resultTrend, resPAR, resLAR, resNPL] = await Promise.all([
      queryAsync(queryTrend, params),
      queryAsync(queryTop5PAR, params),
      queryAsync(queryTop5LAR, params),
      queryAsync(queryTop5NPL, params),
    ]);

    res.json({
      trend: fixNumbers(resultTrend),
      top5: {
        PAR: fixNumbers(resPAR),
        LAR: fixNumbers(resLAR),
        NPL: fixNumbers(resNPL),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ===========================
// Endpoint: Get Growth Summary (with cabang & unit filter)
// ===========================
const getGrowth = async (req, res) => {
  try {
    const db = req.app.get("db");

    // Apply user-level filtering
    const userFilter = req.dataFilter || {};
    let { cabang, unit } = req.query;
    
    // Override query params with user-level restrictions
    if (userFilter.unit_id) {
      unit = userFilter.unit_id;
      cabang = userFilter.cabang_id || cabang;
    } else if (userFilter.cabang_id) {
      cabang = userFilter.cabang_id;
    }

    // Base SQL
    let sql = `
      WITH base AS (
        SELECT 
          STR_TO_DATE(periode, '%d/%m/%Y %H:%i:%s') AS periode_date,
          CAST(NOA    AS DECIMAL(20,2)) AS NOA,
          CAST(OS     AS DECIMAL(20,2)) AS OS,
          CAST(OSPar  AS DECIMAL(20,2)) AS OSPar,
          CAST(OS_LAR AS DECIMAL(20,2)) AS OS_LAR,
          CAST(OSNPL  AS DECIMAL(20,2)) AS OSNPL
        FROM summarymonthly
        WHERE 1=1
    `;

    const params = [];

    // Tambahkan filter kalau ada
    if (cabang && cabang !== "All") {
      sql += " AND UPPER(TRIM(Cabang)) = UPPER(TRIM(?))";
      params.push(cabang);
    }

    if (unit && unit !== "All") {
      sql += " AND UPPER(TRIM(Unit)) = UPPER(TRIM(?))";
      params.push(unit);
    }

    sql += `
      ),
      maxp AS (
        SELECT MAX(periode_date) AS last_periode
        FROM base
      )
      SELECT
        -- =======================
        -- NOA Growth
        -- =======================
        COALESCE((
          (SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT((SELECT last_periode FROM maxp),'%Y-%m') THEN NOA ELSE 0 END) /
            NULLIF(SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 YEAR),'%Y-%m') THEN NOA ELSE 0 END),0)
          ) - 1) * 100,0) AS growth_yoy_noa,

        COALESCE((
          (SUM(CASE WHEN YEAR(periode_date) = YEAR((SELECT last_periode FROM maxp)) THEN NOA ELSE 0 END) /
            NULLIF(SUM(CASE WHEN YEAR(periode_date) = YEAR(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 YEAR)) THEN NOA ELSE 0 END),0)
          ) - 1) * 100,0) AS growth_ytd_noa,

        COALESCE((
          (SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT((SELECT last_periode FROM maxp),'%Y-%m') THEN NOA ELSE 0 END) /
            NULLIF(SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 MONTH),'%Y-%m') THEN NOA ELSE 0 END),0)
          ) - 1) * 100,0) AS growth_mom_noa,

        -- =======================
        -- OS Growth
        -- =======================
        COALESCE((
          (SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT((SELECT last_periode FROM maxp),'%Y-%m') THEN OS ELSE 0 END) /
            NULLIF(SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 YEAR),'%Y-%m') THEN OS ELSE 0 END),0)
          ) - 1) * 100,0) AS growth_yoy_os,

        COALESCE((
          (SUM(CASE WHEN YEAR(periode_date) = YEAR((SELECT last_periode FROM maxp)) THEN OS ELSE 0 END) /
            NULLIF(SUM(CASE WHEN YEAR(periode_date) = YEAR(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 YEAR)) THEN OS ELSE 0 END),0)
          ) - 1) * 100,0) AS growth_ytd_os,

        COALESCE((
          (SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT((SELECT last_periode FROM maxp),'%Y-%m') THEN OS ELSE 0 END) /
            NULLIF(SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 MONTH),'%Y-%m') THEN OS ELSE 0 END),0)
          ) - 1) * 100,0) AS growth_mom_os,

        -- =======================
        -- PAR Growth (pakai rasio PAR% = OSPar / OS)
        -- =======================
        COALESCE((
          (
            (SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT((SELECT last_periode FROM maxp),'%Y-%m') THEN OSPar ELSE 0 END) /
             NULLIF(SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT((SELECT last_periode FROM maxp),'%Y-%m') THEN OS ELSE 0 END),0))
            -
            (SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 YEAR),'%Y-%m') THEN OSPar ELSE 0 END) /
             NULLIF(SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 YEAR),'%Y-%m') THEN OS ELSE 0 END),0))
          ) * 100
        ),0) AS growth_yoy_par,

        COALESCE((
          (
            (SUM(CASE WHEN YEAR(periode_date) = YEAR((SELECT last_periode FROM maxp)) THEN OSPar ELSE 0 END) /
             NULLIF(SUM(CASE WHEN YEAR(periode_date) = YEAR((SELECT last_periode FROM maxp)) THEN OS ELSE 0 END),0))
            -
            (SUM(CASE WHEN YEAR(periode_date) = YEAR(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 YEAR)) THEN OSPar ELSE 0 END) /
             NULLIF(SUM(CASE WHEN YEAR(periode_date) = YEAR(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 YEAR)) THEN OS ELSE 0 END),0))
          ) * 100
        ),0) AS growth_ytd_par,

        COALESCE((
          (
            (SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT((SELECT last_periode FROM maxp),'%Y-%m') THEN OSPar ELSE 0 END) /
             NULLIF(SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT((SELECT last_periode FROM maxp),'%Y-%m') THEN OS ELSE 0 END),0))
            -
            (SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 MONTH),'%Y-%m') THEN OSPar ELSE 0 END) /
             NULLIF(SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 MONTH),'%Y-%m') THEN OS ELSE 0 END),0))
          ) * 100
        ),0) AS growth_mom_par,

        -- =======================
        -- LAR Growth (pakai rasio LAR% = OS_LAR / OS)
        -- =======================
        COALESCE((
          (
            (SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT((SELECT last_periode FROM maxp),'%Y-%m') THEN OS_LAR ELSE 0 END) /
             NULLIF(SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT((SELECT last_periode FROM maxp),'%Y-%m') THEN OS ELSE 0 END),0))
            -
            (SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 YEAR),'%Y-%m') THEN OS_LAR ELSE 0 END) /
             NULLIF(SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 YEAR),'%Y-%m') THEN OS ELSE 0 END),0))
          ) * 100
        ),0) AS growth_yoy_lar,

        COALESCE((
          (
            (SUM(CASE WHEN YEAR(periode_date) = YEAR((SELECT last_periode FROM maxp)) THEN OS_LAR ELSE 0 END) /
             NULLIF(SUM(CASE WHEN YEAR(periode_date) = YEAR((SELECT last_periode FROM maxp)) THEN OS ELSE 0 END),0))
            -
            (SUM(CASE WHEN YEAR(periode_date) = YEAR(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 YEAR)) THEN OS_LAR ELSE 0 END) /
             NULLIF(SUM(CASE WHEN YEAR(periode_date) = YEAR(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 YEAR)) THEN OS ELSE 0 END),0))
          ) * 100
        ),0) AS growth_ytd_lar,

        COALESCE((
          (
            (SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT((SELECT last_periode FROM maxp),'%Y-%m') THEN OS_LAR ELSE 0 END) /
             NULLIF(SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT((SELECT last_periode FROM maxp),'%Y-%m') THEN OS ELSE 0 END),0))
            -
            (SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 MONTH),'%Y-%m') THEN OS_LAR ELSE 0 END) /
             NULLIF(SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 MONTH),'%Y-%m') THEN OS ELSE 0 END),0))
          ) * 100
        ),0) AS growth_mom_lar,

        -- =======================
        -- NPL Growth (pakai rasio NPL% = OSNPL / OS)
        -- =======================
        COALESCE((
          (
            (SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT((SELECT last_periode FROM maxp),'%Y-%m') THEN OSNPL ELSE 0 END) /
             NULLIF(SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT((SELECT last_periode FROM maxp),'%Y-%m') THEN OS ELSE 0 END),0))
            -
            (SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 YEAR),'%Y-%m') THEN OSNPL ELSE 0 END) /
             NULLIF(SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 YEAR),'%Y-%m') THEN OS ELSE 0 END),0))
          ) * 100
        ),0) AS growth_yoy_npl,

        COALESCE((
          (
            (SUM(CASE WHEN YEAR(periode_date) = YEAR((SELECT last_periode FROM maxp)) THEN OSNPL ELSE 0 END) /
             NULLIF(SUM(CASE WHEN YEAR(periode_date) = YEAR((SELECT last_periode FROM maxp)) THEN OS ELSE 0 END),0))
            -
            (SUM(CASE WHEN YEAR(periode_date) = YEAR(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 YEAR)) THEN OSNPL ELSE 0 END) /
             NULLIF(SUM(CASE WHEN YEAR(periode_date) = YEAR(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 YEAR)) THEN OS ELSE 0 END),0))
          ) * 100
        ),0) AS growth_ytd_npl,

        COALESCE((
          (
            (SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT((SELECT last_periode FROM maxp),'%Y-%m') THEN OSNPL ELSE 0 END) /
             NULLIF(SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT((SELECT last_periode FROM maxp),'%Y-%m') THEN OS ELSE 0 END),0))
            -
            (SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 MONTH),'%Y-%m') THEN OSNPL ELSE 0 END) /
             NULLIF(SUM(CASE WHEN DATE_FORMAT(periode_date,'%Y-%m') = DATE_FORMAT(DATE_SUB((SELECT last_periode FROM maxp), INTERVAL 1 MONTH),'%Y-%m') THEN OS ELSE 0 END),0))
          ) * 100
        ),0) AS growth_mom_npl
      FROM base;
    `;

    const [rows] = await db.promise().query(sql, params);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Data growth tidak ditemukan" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error fetching growth:", err.sqlMessage || err);
    res.status(500).json({ error: "Internal Server Error", detail: err.sqlMessage || err.message });
  }
};

// ===========================
// Endpoint: Grafik Jam
// ===========================
const getGrafikJam = async (req, res) => {
  try {
    const db = req.app.get("db");
    
    // Apply user-level filtering
    const userFilter = req.dataFilter || {};
    let { cabang, unit } = req.query;
    
    // Override query params with user-level restrictions
    if (userFilter.unit_id) {
      unit = userFilter.unit_id;
      cabang = userFilter.cabang_id || cabang;
    } else if (userFilter.cabang_id) {
      cabang = userFilter.cabang_id;
    }

    // ================== QUALITY (For Grafik Live ULaMM) ==================
    let sqlQuality = `
      SELECT 
        HOUR(STR_TO_DATE(periode, '%d/%m/%Y %H:%i:%s')) AS jam,
        SUM(CAST(OSPar AS DECIMAL(20,2))) AS total_par,
        SUM(CAST(OS_LAR AS DECIMAL(20,2))) AS total_lar,
        SUM(CAST(OSNPL AS DECIMAL(20,2))) AS total_npl
      FROM \`For Grafik Live ULaMM\`
      WHERE 1=1
    `;
    const paramsQ = [];

    if (cabang && cabang !== "All") {
      sqlQuality += " AND UPPER(TRIM(Cabang)) = UPPER(TRIM(?))";
      paramsQ.push(cabang);
    }
    if (unit && unit !== "All") {
      sqlQuality += " AND UPPER(TRIM(Unit)) = UPPER(TRIM(?))";
      paramsQ.push(unit);
    }

    sqlQuality += ` GROUP BY jam ORDER BY jam `;
    const [rowsQuality] = await db.promise().query(sqlQuality, paramsQ);

    const quality = Array.from({ length: 24 }, (_, i) => {
      const row = rowsQuality.find(r => r.jam === i);
      return {
        jam: i,
        par: row ? Number(row.total_par) : 0,
        lar: row ? Number(row.total_lar) : 0,
        npl: row ? Number(row.total_npl) : 0,
      };
    });

    // ================== PRODUCT (For Grafik Live KM200) ==================
    let sqlProduct = `
      SELECT 
        HOUR(STR_TO_DATE(periode, '%d/%m/%Y %H:%i:%s')) AS jam,
        SUM(CAST(Noa_Plafond_Dibawah_50jt AS DECIMAL(20,2))) AS plafon_50,
        SUM(CAST(Noa_Plafond_51_Hingga_100jt AS DECIMAL(20,2))) AS plafon_100,
        SUM(CAST(Noa_Plafond_101_Hingga_200jt AS DECIMAL(20,2))) AS plafon_200,
        SUM(CAST(Noa_Plafond_201_Hingga_400jt AS DECIMAL(20,2))) AS plafon_400,
        SUM(CAST(Noa_Plafond_Lebih_Dari_400jt AS DECIMAL(20,2))) AS plafon_400plus
      FROM \`For Grafil Live KM200\`
      WHERE 1=1
    `;
    const paramsP = [];

    if (cabang && cabang !== "All") {
      sqlProduct += " AND UPPER(TRIM(Cabang)) = UPPER(TRIM(?))";
      paramsP.push(cabang);
    }
    if (unit && unit !== "All") {
      sqlProduct += " AND UPPER(TRIM(Unit)) = UPPER(TRIM(?))";
      paramsP.push(unit);
    }

    sqlProduct += ` GROUP BY jam ORDER BY jam `;
    const [rowsProduct] = await db.promise().query(sqlProduct, paramsP);

    const product = Array.from({ length: 24 }, (_, i) => {
      const row = rowsProduct.find(r => r.jam === i);
      return {
        jam: i,
        os1: row ? Number(row.os1) : 0,
        os2: row ? Number(row.os2) : 0,
        os3: row ? Number(row.os3) : 0,
        os4: row ? Number(row.os4) : 0,
        os5: row ? Number(row.os5) : 0,
      };
    });

    // ================== RETURN RESPONSE ==================
    res.json({ quality, product });

  } catch (err) {
    console.error("❌ Error fetching grafik jam:", err.sqlMessage || err);
    res.status(500).json({
      error: "Internal Server Error",
      detail: err.sqlMessage || err.message,
    });
  }
};

// ===========================
// Endpoint: getSummaryWO (diperbaiki supaya NULL jadi 0)
// ===========================
const getSummaryWO = (req, res) => {
  try {
    const db = req.app.get("db");
    const { whereClause: whereCondition, params } = buildWhereClause(req, {
      cabangColumn: 'CAB',
      unitColumn: 'nama_unit'
    });

    // ===================== SQL QUERY =====================
    const sql = `
      SELECT 
        SUM(jml_wo) AS card_total_wo,
        (SUM(jml_wo) / NULLIF(SUM(jml_pinjaman), 0) * 100) AS card_pct_wo,
        COUNT(DISTINCT no_rekening) AS card_noa_wo,
        SUM(recovery_pokok) AS card_recovery_pokok,
        SUM(recovery_bunga) AS card_recovery_bunga,
        AVG(HariMenunggak) AS card_avg_hari_menunggak
      FROM \`WO Daily\`
      ${whereCondition};
    `;

    // ===================== EXECUTE QUERY =====================
    db.query(sql, params, (err, results) => {
      if (err) {
        console.error("Error getSummaryWO:", err.sqlMessage || err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results.length > 0) {
        res.json(results[0]);
      } else {
        res.json({
          card_total_wo: 0,
          card_pct_wo: 0,
          card_noa_wo: 0,
          card_recovery_pokok: 0,
          card_recovery_bunga: 0,
          card_avg_hari_menunggak: 0
        });
      }
    });

  } catch (error) {
    console.error("Error getSummaryWO (outer):", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ===========================
// Endpoint: getGrafikWriteOff
// ===========================
const getGrafikWriteOff = (req, res) => {
  try {
    const db = req.app.get("db");
    const { whereClause, params } = buildWhereClause(req, {
      cabangColumn: 'CAB',
      unitColumn: 'nama_unit'
    });
    
    const whereCondition = whereClause || 'WHERE 1=1';

    // ================= Line Chart: Ambil 12 bulan terakhir =================
    const sqlLine = `
      SELECT 
        DATE_FORMAT(STR_TO_DATE(tanggal_wo, '%Y%m%d'), '%Y-%m') AS bulan,
        SUM(jml_wo) AS total_noa
      FROM \`WO Daily\`
      ${whereCondition}
      AND STR_TO_DATE(tanggal_wo, '%Y%m%d') >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY bulan
      ORDER BY bulan
    `;

    db.query(sqlLine, params, (err, lineResult) => {
      if (err) {
        return res.status(500).json({
          message: "Error query line chart",
          error: err,
        });
      }

      // ================= Top 5 Cabang Tahun Berjalan =================
      const sqlTopCab = `
        SELECT CAB, SUM(jml_wo) AS total_noa
        FROM \`WO Daily\`
        ${whereCondition}
        AND YEAR(STR_TO_DATE(tanggal_wo, '%Y%m%d')) = YEAR(CURDATE())
        GROUP BY CAB
        ORDER BY total_noa DESC
        LIMIT 5
      `;

      db.query(sqlTopCab, params, (err, cabResult) => {
        if (err) {
          return res.status(500).json({
            message: "Error query top cab",
            error: err,
          });
        }

        // ================= Top 5 Unit Tahun Berjalan =================
        const sqlTopUnit = `
          SELECT CAB, nama_unit, SUM(jml_wo) AS total_noa
          FROM \`WO Daily\`
          ${whereCondition}
          AND YEAR(STR_TO_DATE(tanggal_wo, '%Y%m%d')) = YEAR(CURDATE())
          GROUP BY CAB, nama_unit
          ORDER BY total_noa DESC
          LIMIT 5
        `;

        db.query(sqlTopUnit, params, (err, unitResult) => {
          if (err) {
            return res.status(500).json({
              message: "Error query top unit",
              error: err,
            });
          }

          res.json({
            lineChart: lineResult,
            topCab: cabResult,
            topUnit: unitResult,
          });
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ===========================
// Export semua function
// ===========================
module.exports = {
  getBranchLocations,
  getFilters,
  getSummary,
  getGrafikPortofolio,
  getGrafikTrenPortofolio,
  getGrafikProductivity,
  getGrafikTrenQuality,
  getGrafikJam,
  getGrowth,
  getSummaryWO,
  getGrafikWriteOff
};