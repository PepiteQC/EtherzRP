```tsx
import React, {
  useEffect,
  useRef,
  useState,
} from 'react'

import styles from './Room3D.module.scss'
import { cn } from '@/lib/utils'

export const Room3D: React.FC = () => {
  const houseRef =
    useRef<HTMLDivElement>(null)

  const containerRef =
    useRef<HTMLDivElement>(null)

  const [
    rotation,
    setRotation,
  ] = useState({
    x: 0,
    y: 0,
  })

  useEffect(() => {
    const handlePointerMove = (
      event: PointerEvent
    ) => {
      if (
        !containerRef.current
      ) {
        return
      }

      const x =
        event.pageX /
          window.innerWidth -
        0.5

      const y =
        event.pageY /
          window.innerHeight -
        0.5

      setRotation({
        x:
          y * 10 +
          75,

        y:
          -x * 25 +
          45,
      })
    }

    window.addEventListener(
      'pointermove',
      handlePointerMove
    )

    return () => {
      window.removeEventListener(
        'pointermove',
        handlePointerMove
      )
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={
        styles.roomContainer
      }
    >
      <div
        ref={houseRef}
        className={
          styles.house
        }
        style={{
          transform:
            `perspective(90vw) ` +
            `rotateX(${rotation.x}deg) ` +
            `rotateZ(${rotation.y}deg) ` +
            `translateZ(-9vw)`,
        }}
      >
        <div
          className={
            styles.hLights
          }
        >
          {[
            ...Array(6),
          ].map(
            (
              _,
              index
            ) => (
              <div
                key={index}
                className={
                  styles.hLight
                }
              />
            )
          )}
        </div>

        <div
          className={
            styles.hShadow
          }
        />

        {/* Base */}
        <div
          className={
            styles.alt
          }
        >
          <div
            className={cn(
              styles.face,
              styles.alt__front
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.alt__back
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.alt__right
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.alt__left
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.alt__top
            )}
          >
            {[
              ...Array(9),
            ].map(
              (
                _,
                index
              ) => (
                <div
                  key={index}
                  className={
                    styles.light
                  }
                />
              )
            )}
          </div>

          <div
            className={cn(
              styles.face,
              styles.alt__bottom
            )}
          />
        </div>

        <div
          className={
            styles.alb
          }
        >
          <div
            className={cn(
              styles.face,
              styles.alb__front
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.alb__back
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.alb__right
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.alb__left
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.alb__top
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.alb__bottom
            )}
          />
        </div>

        <div
          className={
            styles.arb
          }
        >
          <div
            className={cn(
              styles.face,
              styles.arb__front
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.arb__back
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.arb__right
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.arb__left
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.arb__top
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.arb__bottom
            )}
          />
        </div>

        {/* Walls */}
        <div
          className={
            styles.blt
          }
        >
          <div
            className={cn(
              styles.face,
              styles.blt__front
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.blt__back
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.blt__right
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.blt__left
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.blt__top
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.blt__bottom
            )}
          />
        </div>

        <div
          className={
            styles.blt2
          }
        >
          <div
            className={cn(
              styles.face,
              styles.blt2__front
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.blt2__back
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.blt2__right
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.blt2__left
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.blt2__top
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.blt2__bottom
            )}
          />
        </div>

        <div
          className={
            styles.blb
          }
        >
          <div
            className={cn(
              styles.face,
              styles.blb__front
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.blb__back
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.blb__right
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.blb__left
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.blb__top
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.blb__bottom
            )}
          />
        </div>

        <div
          className={
            styles.blb2
          }
        >
          <div
            className={cn(
              styles.face,
              styles.blb2__front
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.blb2__back
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.blb2__right
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.blb2__left
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.blb2__top
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.blb2__bottom
            )}
          />
        </div>

        {/* Door */}
        <div
          className={
            styles.puertaC
          }
        >
          <div
            className={
              styles.puerta
            }
          >
            <div
              className={cn(
                styles.face,
                styles.puerta__front
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.puerta__back
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.puerta__right
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.puerta__left
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.puerta__top
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.puerta__bottom
              )}
            />
          </div>

          <div
            className={
              styles.puertaL
            }
          >
            <div
              className={cn(
                styles.face,
                styles.puertaL__front
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.puertaL__back
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.puertaL__right
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.puertaL__left
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.puertaL__top
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.puertaL__bottom
              )}
            />
          </div>

          <div
            className={
              styles.puertaR
            }
          >
            <div
              className={cn(
                styles.face,
                styles.puertaR__front
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.puertaR__back
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.puertaR__right
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.puertaR__left
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.puertaR__top
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.puertaR__bottom
              )}
            />
          </div>

          <div
            className={
              styles.puertaT
            }
          >
            <div
              className={cn(
                styles.face,
                styles.puertaT__front
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.puertaT__back
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.puertaT__right
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.puertaT__left
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.puertaT__top
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.puertaT__bottom
              )}
            />
          </div>
        </div>

        {/* Paintings */}
        <div
          className={
            styles.cuadroL
          }
        >
          <div
            className={cn(
              styles.face,
              styles.cuadroL__front
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.cuadroL__back
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.cuadroL__right
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.cuadroL__left
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.cuadroL__top
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.cuadroL__bottom
            )}
          />
        </div>

        <div
          className={
            styles.cuadroR
          }
        >
          <div
            className={cn(
              styles.face,
              styles.cuadroR__front
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.cuadroR__back
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.cuadroR__right
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.cuadroR__left
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.cuadroR__top
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.cuadroR__bottom
            )}
          />
        </div>

        {/* Bookcase */}
        <div
          className={
            styles.librero
          }
        >
          <div
            className={cn(
              styles.face,
              styles.librero__front
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.librero__back
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.librero__right
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.librero__left
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.librero__top
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.librero__bottom
            )}
          />
        </div>

        <div
          className={
            styles.libros
          }
        >
          {[
            ...Array(6),
          ].map(
            (
              _,
              index
            ) => (
              <div
                key={index}
                className={
                  styles.libro
                }
              >
                <div
                  className={cn(
                    styles.face,
                    styles.libro__front
                  )}
                />

                <div
                  className={cn(
                    styles.face,
                    styles.libro__back
                  )}
                />

                <div
                  className={cn(
                    styles.face,
                    styles.libro__right
                  )}
                />

                <div
                  className={cn(
                    styles.face,
                    styles.libro__left
                  )}
                />

                <div
                  className={cn(
                    styles.face,
                    styles.libro__top
                  )}
                />

                <div
                  className={cn(
                    styles.face,
                    styles.libro__bottom
                  )}
                />
              </div>
            )
          )}
        </div>

        {/* TV */}
        <div
          className={
            styles.tv
          }
        >
          <div
            className={cn(
              styles.face,
              styles.tv__front
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.tv__back
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.tv__right
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.tv__left
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.tv__top
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.tv__bottom
            )}
          />
        </div>

        {/* Speakers */}
        <div
          className={
            styles.bocinaL
          }
        >
          <div
            className={cn(
              styles.face,
              styles.bocinaL__front
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.bocinaL__back
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.bocinaL__right
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.bocinaL__left
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.bocinaL__top
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.bocinaL__bottom
            )}
          />
        </div>

        <div
          className={
            styles.bocinaR
          }
        >
          <div
            className={cn(
              styles.face,
              styles.bocinaR__front
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.bocinaR__back
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.bocinaR__right
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.bocinaR__left
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.bocinaR__top
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.bocinaR__bottom
            )}
          />
        </div>

        {/* Shelves */}
        <div
          className={
            styles.repisaT
          }
        >
          <div
            className={cn(
              styles.face,
              styles.repisaT__front
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.repisaT__back
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.repisaT__right
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.repisaT__left
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.repisaT__top
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.repisaT__bottom
            )}
          />
        </div>

        <div
          className={
            styles.repisaB
          }
        >
          <div
            className={cn(
              styles.face,
              styles.repisaB__front
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.repisaB__back
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.repisaB__right
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.repisaB__left
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.repisaB__top
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.repisaB__bottom
            )}
          />
        </div>

        {/* Wall detail */}
        <div
          className={
            styles.muro
          }
        >
          <div
            className={cn(
              styles.face,
              styles.muro__front
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.muro__back
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.muro__right
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.muro__left
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.muro__top
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.muro__bottom
            )}
          />
        </div>

        {/* Sofa */}
        <div
          className={
            styles.sillonC
          }
        >
          <div
            className={
              styles.sillonB
            }
          >
            <div
              className={cn(
                styles.face,
                styles.sillonB__front
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.sillonB__back
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.sillonB__right
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.sillonB__left
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.sillonB__top
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.sillonB__bottom
              )}
            />
          </div>

          <div
            className={
              styles.sillonT
            }
          >
            <div
              className={cn(
                styles.face,
                styles.sillonT__front
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.sillonT__back
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.sillonT__right
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.sillonT__left
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.sillonT__top
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.sillonT__bottom
              )}
            />
          </div>

          <div
            className={
              styles.sillonL
            }
          >
            <div
              className={cn(
                styles.face,
                styles.sillonL__front
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.sillonL__back
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.sillonL__right
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.sillonL__left
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.sillonL__top
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.sillonL__bottom
              )}
            />
          </div>

          <div
            className={
              styles.sillonR
            }
          >
            <div
              className={cn(
                styles.face,
                styles.sillonR__front
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.sillonR__back
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.sillonR__right
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.sillonR__left
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.sillonR__top
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.sillonR__bottom
              )}
            />
          </div>
        </div>

        {/* Table */}
        <div
          className={
            styles.mesaC
          }
        >
          <div
            className={
              styles.mesa
            }
          >
            <div
              className={cn(
                styles.face,
                styles.mesa__front
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.mesa__back
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.mesa__right
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.mesa__left
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.mesa__top
              )}
            />

            <div
              className={cn(
                styles.face,
                styles.mesa__bottom
              )}
            />
          </div>

          {[
            ...Array(4),
          ].map(
            (
              _,
              index
            ) => (
              <div
                key={index}
                className={
                  styles.mesaP
                }
              >
                <div
                  className={cn(
                    styles.face,
                    styles.mesaP__front
                  )}
                />

                <div
                  className={cn(
                    styles.face,
                    styles.mesaP__back
                  )}
                />

                <div
                  className={cn(
                    styles.face,
                    styles.mesaP__right
                  )}
                />

                <div
                  className={cn(
                    styles.face,
                    styles.mesaP__left
                  )}
                />

                <div
                  className={cn(
                    styles.face,
                    styles.mesaP__top
                  )}
                />

                <div
                  className={cn(
                    styles.face,
                    styles.mesaP__bottom
                  )}
                />
              </div>
            )
          )}

          <div
            className={
              styles.mesaShadow
            }
          />
        </div>

        {/* Tablet */}
        <div
          className={
            styles.tablet
          }
        >
          <div
            className={cn(
              styles.face,
              styles.tablet__front
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.tablet__back
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.tablet__right
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.tablet__left
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.tablet__top
            )}
          />

          <div
            className={cn(
              styles.face,
              styles.tablet__bottom
            )}
          />
        </div>
      </div>
    </div>
  )
}
```
