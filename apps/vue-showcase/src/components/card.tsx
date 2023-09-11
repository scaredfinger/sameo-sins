import { AsyncResult } from "@scaredfinger/cards-by-cats-vm"

import { Trip } from "../api/trips-and-collections"
import { h } from "vue"
import { PortableText } from '@portabletext/vue'

interface WtihStyles {
  styles: { [key: string]: string }
}

interface Props extends WtihStyles {
  card: AsyncResult<Trip>
}

export const Card = ({ card, styles }: Props) => {

  return card.match({
    Done: (done) => done.match({
      Ok: (okCard) => h('div', {
        class: `${styles.card} ${styles.done}`
      }, [
        h('h3', {}, okCard.headline),
        renderPortableText(okCard.salesPitch),
        h('div', {
          class: styles.cardImageList
        }, okCard.images.map((image, i) => h('img', {
          key: i,
          src: image,
          class: styles.cardImage
        })))
      ]),
      Error: (error) => renderError({ error })
    }),
    Loading: () => renderLoading({ styles }),
    NotAsked: () => renderNotAsked({ styles }),
  })
}

function renderPortableText(value: any) {
  return (
    <PortableText
      value={value}
    />
  )
}

function renderNotAsked({ styles }: WtihStyles) {
  return h('div', {
    class: `${styles.card} ${styles.notAsked}`
  }, [])
}

function renderLoading({styles}: WtihStyles) {
  return h('div', {
    class: `${styles.card} ${styles.loading}`
  })
}

function renderError({ error }: { error: Error }) {
  return h('div', {}, [
    `Error: ${error.message}`
  ])
}