import type { ReportExportsResource } from './report-exports.en-US.js';

const idID: ReportExportsResource = {
  reportExports: {
    sheet: 'Laporan',
    leaveMonthly: {
      fields: {
        year: 'Tahun',
        month: 'Bulan mulai',
        leaveType: 'Jenis cuti',
        approvedRequestCount: 'Jumlah permintaan disetujui',
        approvedRequestedDays:
          'Hari yang diminta dan disetujui (sebelum pembatalan)',
      },
    },
    budgetBalances: {
      fields: {
        departmentName: 'Departemen',
        year: 'Tahun',
        subject: 'Pos anggaran',
        allocatedCents: 'Dialokasikan dalam sen',
        heldCents: 'Ditahan dalam sen',
        usedCents: 'Terpakai dalam sen',
        availableCents: 'Tersedia dalam sen',
      },
    },
    headcountBalances: {
      fields: {
        departmentName: 'Departemen',
        positionName: 'Jabatan',
        year: 'Tahun',
        limit: 'Batas',
        initialized: 'Diinisialisasi',
        used: 'Terpakai',
        pending: 'Menunggu',
        allocated: 'Dialokasikan',
        replacementPending: 'Pengganti tertunda',
        replacementAllocated: 'Pengganti dialokasikan',
        replacementBlocked: 'Pengganti diblokir',
        available: 'Tersedia',
        capacityState: 'Status kapasitas',
      },
    },
    contractLedger: {
      fields: {
        number: 'Nomor',
        departmentName: 'Departemen',
        status: 'Status',
        amountCents: 'Jumlah dalam sen',
        heldCents: 'Ditahan dalam sen',
        paidCents: 'Dibayar dalam sen',
        availableCents: 'Tersedia dalam sen',
        startsOn: 'Mulai pada',
        endsOn: 'Berakhir pada',
        asOf: 'Per',
        expiryState: 'Status kedaluwarsa',
        paymentState: 'Status pembayaran',
        paidBasisPoints: 'Pembayaran dalam basis poin',
      },
    },
    expenseSummary: {
      fields: {
        year: 'Tahun',
        month: 'Bulan biaya',
        category: 'Kode kategori',
        settledRequestCount: 'Jumlah permintaan diselesaikan',
        settledExpenseCents: 'Biaya bruto diselesaikan dalam sen (bukan kas)',
      },
    },
    approvalEfficiency: {
      fields: {
        stage: 'Tahap',
        completedTaskCount: 'Jumlah tugas keputusan selesai',
        totalElapsedMs: 'Total milidetik kalender berlalu (termasuk penantian)',
        averageElapsedMs:
          'Rata-rata milidetik kalender berlalu (termasuk penantian)',
      },
      sheet: 'Tugas cuti selesai',
      stages: {
        manager: 'Manajer',
        head: 'Kepala departemen',
        hr: 'SDM',
      },
    },
    approvalReturnRate: {
      fields: {
        year: 'Tahun mulai saat ini',
        month: 'Bulan mulai saat ini',
        submittedRunCount:
          'Batch historis yang diajukan (termasuk yang masih terbuka)',
        returnedRunCount: 'Batch historis dengan pengembalian',
        returnDecisionCount: 'Jumlah keputusan pengembalian',
        returnRateBasisPoints: 'Tingkat pengembalian dalam basis poin',
      },
      sheet: 'Tingkat pengembalian cuti',
    },
  },
};

export default idID;
