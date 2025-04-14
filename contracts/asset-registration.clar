;; Asset Registration Contract
;; Records details of medical equipment

;; Contract owner
(define-data-var contract-owner principal tx-sender)

(define-data-var last-asset-id uint u0)

;; Asset status: 1 = available, 2 = leased, 3 = maintenance
(define-map assets
  { asset-id: uint }
  {
    equipment-type: (string-utf8 50),
    model: (string-utf8 50),
    serial-number: (string-utf8 50),
    purchase-date: uint,
    value: uint,
    owner: principal,
    status: uint
  }
)

;; Register new medical equipment
(define-public (register-asset (equipment-type (string-utf8 50)) (model (string-utf8 50)) (serial-number (string-utf8 50)) (purchase-date uint) (value uint))
  (let
    (
      (new-id (+ (var-get last-asset-id) u1))
    )
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u403))
    (var-set last-asset-id new-id)
    (map-set assets
      { asset-id: new-id }
      {
        equipment-type: equipment-type,
        model: model,
        serial-number: serial-number,
        purchase-date: purchase-date,
        value: value,
        owner: tx-sender,
        status: u1
      }
    )
    (ok new-id)
  )
)

;; Update asset status
(define-public (update-asset-status (asset-id uint) (new-status uint))
  (let
    (
      (asset (unwrap! (map-get? assets { asset-id: asset-id }) (err u404)))
    )
    (asserts! (is-eq tx-sender (get owner asset)) (err u403))
    (asserts! (and (>= new-status u1) (<= new-status u3)) (err u400))
    (map-set assets
      { asset-id: asset-id }
      (merge asset { status: new-status })
    )
    (ok true)
  )
)

;; Get asset details
(define-read-only (get-asset (asset-id uint))
  (map-get? assets { asset-id: asset-id })
)

;; Transfer asset ownership
(define-public (transfer-asset (asset-id uint) (new-owner principal))
  (let
    (
      (asset (unwrap! (map-get? assets { asset-id: asset-id }) (err u404)))
    )
    (asserts! (is-eq tx-sender (get owner asset)) (err u403))
    (map-set assets
      { asset-id: asset-id }
      (merge asset { owner: new-owner })
    )
    (ok true)
  )
)

;; Update contract owner
(define-public (set-contract-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u403))
    (var-set contract-owner new-owner)
    (ok true)
  )
)
