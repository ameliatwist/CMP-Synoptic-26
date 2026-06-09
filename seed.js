const db = require('./app/db');
const bcrypt = require('bcrypt');

// Demo accounts created by this script:
//   Resident : username = testuser  / password = Password123
//   Council  : username = admin     / password = Password123

async function seed() {

  // Ensure a test resident account exists
  const existing = await db.oneOrNone('SELECT id FROM users WHERE username = $1', ['testuser']);
  let userId;
  if (!existing) {
    const hash = await bcrypt.hash('Password123', 10);
    const user = await db.one(
      `INSERT INTO users (fullname, username, email, password, points)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      ['Test User', 'testuser', 'testuser@example.com', hash, 180]
    );
    userId = user.id;
    console.log('Created test user (testuser / Password123)');
  } else {
    userId = existing.id;
    console.log('Test user already exists');
  }

  // Clear existing seed reports so we don't double up
  await db.none('DELETE FROM reports WHERE user_id = $1', [userId]);

  // Realistic Ladywood-area reports
  const reports = [
    // Icknield Port Road cluster (high volume area)
    { location: 'Icknield Port Road, Ladywood',        lat: 52.4871, lng: -1.9201, type: 'street',             level: 'overflowing',  desc: 'Bin by the park entrance has been overflowing for 3 days', status: 'pending'   },
    { location: 'Icknield Port Road, Ladywood',        lat: 52.4875, lng: -1.9198, type: 'street',             level: 'full',         desc: 'Second bin on same road also full',                        status: 'pending'   },
    { location: 'Icknield Port Road, Ladywood',        lat: 52.4868, lng: -1.9205, type: 'household',          level: 'almost_full',  desc: '',                                                         status: 'collected' },
    { location: 'Icknield Port Road, Ladywood',        lat: 52.4872, lng: -1.9195, type: 'street',             level: 'overflowing',  desc: 'Bin knocked over, rubbish on the pavement',                status: 'approved'  },
    { location: 'Icknield Port Road, Ladywood',        lat: 52.4865, lng: -1.9208, type: 'missed_collection',  level: null,           desc: 'Bin not collected since last Monday',                       status: 'pending'   },
    { location: 'Icknield Port Road, Ladywood',        lat: 52.4877, lng: -1.9200, type: 'household',          level: 'full',         desc: '',                                                         status: 'approved'  },

    // Monument Road cluster
    { location: 'Monument Road, Ladywood',             lat: 52.4832, lng: -1.9155, type: 'street',             level: 'almost_full',  desc: 'Street bin near bus stop nearly full',                     status: 'pending'   },
    { location: 'Monument Road, Ladywood',             lat: 52.4835, lng: -1.9152, type: 'street',             level: 'overflowing',  desc: 'Same bin as last week, still not emptied',                 status: 'pending'   },
    { location: 'Monument Road, Ladywood',             lat: 52.4829, lng: -1.9158, type: 'household',          level: 'half_full',    desc: '',                                                         status: 'collected' },
    { location: 'Monument Road, Ladywood',             lat: 52.4838, lng: -1.9148, type: 'missed_collection',  level: null,           desc: 'Recycling bin not collected for two weeks',                 status: 'approved'  },
    { location: 'Monument Road, Ladywood',             lat: 52.4831, lng: -1.9161, type: 'street',             level: 'full',         desc: 'Lid broken off',                                           status: 'rejected'  },

    // Ledsam Street
    { location: 'Ledsam Street, Ladywood',             lat: 52.4845, lng: -1.9178, type: 'household',          level: 'full',         desc: '',                                                         status: 'approved'  },
    { location: 'Ledsam Street, Ladywood',             lat: 52.4842, lng: -1.9182, type: 'street',             level: 'overflowing',  desc: 'Fast food litter all around the bin',                      status: 'pending'   },
    { location: 'Ledsam Street, Ladywood',             lat: 52.4847, lng: -1.9174, type: 'household',          level: 'almost_full',  desc: '',                                                         status: 'collected' },
    { location: 'Ledsam Street, Ladywood',             lat: 52.4840, lng: -1.9185, type: 'missed_collection',  level: null,           desc: 'Missed again this week',                                    status: 'pending'   },

    // Ladywood Middleway
    { location: 'Ladywood Middleway',                  lat: 52.4789, lng: -1.9112, type: 'street',             level: 'overflowing',  desc: 'Overflowing, litter on pavement',                          status: 'pending'   },
    { location: 'Ladywood Middleway',                  lat: 52.4793, lng: -1.9108, type: 'street',             level: 'full',         desc: '',                                                         status: 'approved'  },
    { location: 'Ladywood Middleway',                  lat: 52.4786, lng: -1.9117, type: 'street',             level: 'almost_full',  desc: 'Bin outside shops always fills up quickly',                status: 'collected' },
    { location: 'Ladywood Middleway',                  lat: 52.4791, lng: -1.9114, type: 'missed_collection',  level: null,           desc: '',                                                         status: 'pending'   },

    // Browning Street
    { location: 'Browning Street, Ladywood',           lat: 52.4855, lng: -1.9230, type: 'household',          level: 'half_full',    desc: '',                                                         status: 'approved'  },
    { location: 'Browning Street, Ladywood',           lat: 52.4852, lng: -1.9235, type: 'street',             level: 'full',         desc: '',                                                         status: 'pending'   },
    { location: 'Browning Street, Ladywood',           lat: 52.4858, lng: -1.9226, type: 'household',          level: 'overflowing',  desc: 'Bags left outside because bin is full',                    status: 'pending'   },

    // St Vincents Street
    { location: 'St Vincents Street, Ladywood',        lat: 52.4860, lng: -1.9190, type: 'street',             level: 'full',         desc: 'Bin lid cannot close',                                     status: 'pending'   },
    { location: 'St Vincents Street, Ladywood',        lat: 52.4857, lng: -1.9194, type: 'household',          level: 'barely_full',  desc: '',                                                         status: 'collected' },
    { location: 'St Vincents Street, Ladywood',        lat: 52.4863, lng: -1.9187, type: 'missed_collection',  level: null,           desc: 'Third week in a row with no collection',                    status: 'approved'  },

    // Grosvenor Street West
    { location: 'Grosvenor Street West, Ladywood',     lat: 52.4812, lng: -1.9140, type: 'street',             level: 'overflowing',  desc: '',                                                         status: 'rejected'  },
    { location: 'Grosvenor Street West, Ladywood',     lat: 52.4815, lng: -1.9136, type: 'household',          level: 'almost_full',  desc: '',                                                         status: 'pending'   },
    { location: 'Grosvenor Street West, Ladywood',     lat: 52.4809, lng: -1.9144, type: 'street',             level: 'full',         desc: 'Bin near the corner shop',                                  status: 'collected' },

    // Ryland Street
    { location: 'Ryland Street, Ladywood',             lat: 52.4821, lng: -1.9168, type: 'household',          level: 'almost_full',  desc: 'Collection was missed last week',                          status: 'pending'   },
    { location: 'Ryland Street, Ladywood',             lat: 52.4818, lng: -1.9172, type: 'street',             level: 'full',         desc: '',                                                         status: 'approved'  },
    { location: 'Ryland Street, Ladywood',             lat: 52.4824, lng: -1.9164, type: 'missed_collection',  level: null,           desc: 'Reported to the council twice already',                     status: 'pending'   },

    // Ruston Street
    { location: 'Ruston Street, Ladywood',             lat: 52.4878, lng: -1.9210, type: 'street',             level: 'barely_full',  desc: '',                                                         status: 'approved'  },
    { location: 'Ruston Street, Ladywood',             lat: 52.4881, lng: -1.9206, type: 'household',          level: 'half_full',    desc: '',                                                         status: 'collected' },

    // Alston Street
    { location: 'Alston Street, Ladywood',             lat: 52.4849, lng: -1.9145, type: 'household',          level: 'full',         desc: '',                                                         status: 'pending'   },
    { location: 'Alston Street, Ladywood',             lat: 52.4846, lng: -1.9149, type: 'street',             level: 'overflowing',  desc: 'Bin near the school, always busy',                         status: 'pending'   },
    { location: 'Alston Street, Ladywood',             lat: 52.4852, lng: -1.9141, type: 'missed_collection',  level: null,           desc: '',                                                         status: 'approved'  },

    // Sheepcote Street
    { location: 'Sheepcote Street, Ladywood',          lat: 52.4801, lng: -1.9102, type: 'street',             level: 'overflowing',  desc: 'Multiple bags dumped next to the bin',                     status: 'pending'   },
    { location: 'Sheepcote Street, Ladywood',          lat: 52.4804, lng: -1.9098, type: 'household',          level: 'full',         desc: '',                                                         status: 'collected' },
    { location: 'Sheepcote Street, Ladywood',          lat: 52.4798, lng: -1.9106, type: 'street',             level: 'almost_full',  desc: 'Bin damaged, door not closing properly',                   status: 'approved'  },

    // Hagley Road
    { location: 'Hagley Road, Ladywood',               lat: 52.4798, lng: -1.9220, type: 'street',             level: 'almost_full',  desc: '',                                                         status: 'approved'  },
    { location: 'Hagley Road, Ladywood',               lat: 52.4795, lng: -1.9225, type: 'street',             level: 'overflowing',  desc: 'Very busy stretch, needs more frequent emptying',          status: 'pending'   },
    { location: 'Hagley Road, Ladywood',               lat: 52.4801, lng: -1.9215, type: 'missed_collection',  level: null,           desc: '',                                                         status: 'pending'   },
    { location: 'Hagley Road, Ladywood',               lat: 52.4793, lng: -1.9228, type: 'street',             level: 'full',         desc: '',                                                         status: 'collected' },

    // Marroway Street
    { location: 'Marroway Street, Ladywood',           lat: 52.4862, lng: -1.9175, type: 'household',          level: 'half_full',    desc: '',                                                         status: 'approved'  },
    { location: 'Marroway Street, Ladywood',           lat: 52.4859, lng: -1.9179, type: 'street',             level: 'full',         desc: '',                                                         status: 'pending'   },

    // Rotton Park Road
    { location: 'Rotton Park Road, Ladywood',          lat: 52.4883, lng: -1.9241, type: 'street',             level: 'overflowing',  desc: 'Bin outside the convenience store always overflows',       status: 'pending'   },
    { location: 'Rotton Park Road, Ladywood',          lat: 52.4886, lng: -1.9237, type: 'household',          level: 'full',         desc: '',                                                         status: 'collected' },
    { location: 'Rotton Park Road, Ladywood',          lat: 52.4880, lng: -1.9245, type: 'missed_collection',  level: null,           desc: 'Bin not collected in 2 weeks',                              status: 'approved'  },
    { location: 'Rotton Park Road, Ladywood',          lat: 52.4889, lng: -1.9233, type: 'street',             level: 'almost_full',  desc: '',                                                         status: 'pending'   },

    // City Road
    { location: 'City Road, Ladywood',                 lat: 52.4776, lng: -1.9188, type: 'street',             level: 'full',         desc: 'Bin on corner near traffic lights',                        status: 'approved'  },
    { location: 'City Road, Ladywood',                 lat: 52.4772, lng: -1.9193, type: 'household',          level: 'almost_full',  desc: '',                                                         status: 'pending'   },
    { location: 'City Road, Ladywood',                 lat: 52.4779, lng: -1.9184, type: 'street',             level: 'overflowing',  desc: 'Rubbish piling up on both sides of the bin',               status: 'pending'   },
    { location: 'City Road, Ladywood',                 lat: 52.4769, lng: -1.9197, type: 'missed_collection',  level: null,           desc: '',                                                         status: 'collected' },

    // Reservoir Road
    { location: 'Reservoir Road, Ladywood',            lat: 52.4892, lng: -1.9258, type: 'household',          level: 'half_full',    desc: '',                                                         status: 'approved'  },
    { location: 'Reservoir Road, Ladywood',            lat: 52.4895, lng: -1.9254, type: 'street',             level: 'full',         desc: '',                                                         status: 'pending'   },
    { location: 'Reservoir Road, Ladywood',            lat: 52.4889, lng: -1.9262, type: 'missed_collection',  level: null,           desc: 'Garden waste not collected',                                status: 'pending'   },

    // Spring Hill
    { location: 'Spring Hill, Ladywood',               lat: 52.4823, lng: -1.9128, type: 'street',             level: 'overflowing',  desc: 'Bin outside the launderette completely full',              status: 'pending'   },
    { location: 'Spring Hill, Ladywood',               lat: 52.4826, lng: -1.9124, type: 'household',          level: 'full',         desc: '',                                                         status: 'collected' },
    { location: 'Spring Hill, Ladywood',               lat: 52.4820, lng: -1.9132, type: 'street',             level: 'almost_full',  desc: '',                                                         status: 'approved'  },

    // Wrentham Street
    { location: 'Wrentham Street, Ladywood',           lat: 52.4808, lng: -1.9088, type: 'street',             level: 'full',         desc: 'Bin near takeaway, fills up every evening',                status: 'pending'   },
    { location: 'Wrentham Street, Ladywood',           lat: 52.4811, lng: -1.9084, type: 'household',          level: 'barely_full',  desc: '',                                                         status: 'approved'  },
    { location: 'Wrentham Street, Ladywood',           lat: 52.4805, lng: -1.9092, type: 'missed_collection',  level: null,           desc: 'Bin left at the end of the road uncollected',               status: 'pending'   },

    // Cope Street
    { location: 'Cope Street, Ladywood',               lat: 52.4837, lng: -1.9118, type: 'household',          level: 'almost_full',  desc: '',                                                         status: 'pending'   },
    { location: 'Cope Street, Ladywood',               lat: 52.4834, lng: -1.9122, type: 'street',             level: 'overflowing',  desc: 'Overflowing since the weekend',                             status: 'approved'  },

    // King Edwards Road
    { location: 'King Edwards Road, Ladywood',         lat: 52.4815, lng: -1.9075, type: 'street',             level: 'full',         desc: '',                                                         status: 'collected' },
    { location: 'King Edwards Road, Ladywood',         lat: 52.4818, lng: -1.9071, type: 'household',          level: 'half_full',    desc: '',                                                         status: 'approved'  },
    { location: 'King Edwards Road, Ladywood',         lat: 52.4812, lng: -1.9079, type: 'missed_collection',  level: null,           desc: 'Blue bin not collected for 3 weeks',                        status: 'pending'   },

    // Friston Avenue
    { location: 'Friston Avenue, Ladywood',            lat: 52.4866, lng: -1.9218, type: 'household',          level: 'full',         desc: '',                                                         status: 'pending'   },
    { location: 'Friston Avenue, Ladywood',            lat: 52.4869, lng: -1.9214, type: 'street',             level: 'almost_full',  desc: '',                                                         status: 'approved'  },

    // Duchess Road
    { location: 'Duchess Road, Ladywood',              lat: 52.4843, lng: -1.9162, type: 'street',             level: 'overflowing',  desc: 'Bin surrounded by loose rubbish bags',                     status: 'pending'   },
    { location: 'Duchess Road, Ladywood',              lat: 52.4840, lng: -1.9166, type: 'missed_collection',  level: null,           desc: '',                                                         status: 'collected' },
  ];

  for (const r of reports) {
    await db.none(
      `INSERT INTO reports (user_id, description, location, bin_level, report_type, latitude, longitude, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [userId, r.desc, r.location, r.level, r.type, r.lat, r.lng, r.status]
    );
    // Give points for each report
    await db.none('UPDATE users SET points = points + 10 WHERE id = $1', [userId]);
  }

  console.log(`Seeded ${reports.length} reports around Ladywood.`);
  process.exit(0);
}

seed().catch(e => { console.error('Seed error:', e.message); process.exit(1); });
